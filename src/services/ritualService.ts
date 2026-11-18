import { supabase } from '@/lib/supabase'
import { fetchAllPages } from '@/lib/paginate'
import { lastNDays, toDateKey } from '@/utils/dates'
import type { Difficulty, Frequency, Ritual, RitualLog } from '@/types'
import type { ExportData } from '@/utils/exportImport'

interface RitualRow {
  id: string
  user_id: string
  title: string
  description: string
  difficulty: Difficulty
  frequency: Frequency
  streak: number
  best_streak: number
  current_streak?: number
  essence_reward: number
  created_at: string
  archived_at?: string | null
}

interface LogRow {
  id: string
  ritual_id: string
  user_id: string
  date: string
  essence_gained: number
  protected: boolean
}

export interface RitualBundle {
  /** Active rituals with their live streak. */
  rituals: Ritual[]
  /** Archived rituals: hidden from the lists, kept for history and exports. */
  archived: Ritual[]
  logs: RitualLog[]
  /** "Today" (YYYY-MM-DD) in the user's server-side time zone. */
  today: string
}

export interface CompleteResult {
  success: boolean
  reason?: string
  log_id?: string
  date?: string
  essence_gained?: number
  streak?: number
}

export interface ImportResult {
  rituals: number
  reused: number
  logs: number
  skipped: number
}

/**
 * Days of history loaded for the UI (heatmap, calendar, analytics). Totals and
 * achievements use server aggregates, and exports read the full history.
 */
export const HISTORY_DAYS = 400

export interface CreateRitualInput {
  title: string
  description: string
  difficulty: Difficulty
  frequency: Frequency
}

function mapRitual(row: RitualRow): Ritual {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    frequency: row.frequency,
    streak: row.current_streak ?? row.streak,
    bestStreak: Math.max(row.best_streak ?? 0, row.current_streak ?? 0),
    essenceReward: row.essence_reward,
    created_at: row.created_at,
  }
}

function mapLog(row: LogRow): RitualLog {
  return {
    id: row.id,
    ritualId: row.ritual_id,
    user_id: row.user_id,
    date: row.date,
    essence_gained: row.essence_gained,
    protected: row.protected,
  }
}

export const ritualService = {
  async list(userId: string): Promise<RitualBundle> {
    const since = lastNDays(HISTORY_DAYS)[0]
    const [ritualsResult, archivedResult, todayResult, logRows] =
      await Promise.all([
        supabase
          .from('rituals_with_streak')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        supabase
          .from('rituals')
          .select('*')
          .eq('user_id', userId)
          .not('archived_at', 'is', null)
          .order('archived_at', { ascending: false }),
        // The server decides "today" (user time zone) so every device agrees.
        supabase.rpc('user_today', { p_user_id: userId }),
        fetchAllPages<LogRow>((from, to) => {
          let query = supabase
            .from('ritual_logs')
            .select('*')
            .eq('user_id', userId)
            // Days filled by the Potion of Oblivion keep streaks alive on the
            // server but are not completions, so they stay out of client stats.
            .eq('protected', false)
          if (since) query = query.gte('date', since)
          return query
            .order('date', { ascending: true })
            .order('id', { ascending: true })
            .range(from, to)
        }),
      ])

    if (ritualsResult.error) throw ritualsResult.error
    if (archivedResult.error) throw archivedResult.error

    return {
      rituals: ((ritualsResult.data ?? []) as RitualRow[]).map(mapRitual),
      archived: ((archivedResult.data ?? []) as RitualRow[]).map((row) => ({
        ...mapRitual(row),
        streak: 0,
      })),
      logs: logRows.map(mapLog),
      today:
        typeof todayResult.data === 'string' && !todayResult.error
          ? todayResult.data.slice(0, 10)
          : toDateKey(),
    }
  },

  async create(userId: string, input: CreateRitualInput): Promise<Ritual> {
    const { data, error } = await supabase
      .from('rituals')
      .insert({
        user_id: userId,
        title: input.title.trim(),
        description: input.description.trim(),
        difficulty: input.difficulty,
        frequency: input.frequency,
      })
      .select('*')
      .single()
    if (error) throw error
    return mapRitual(data as RitualRow)
  },

  /** Reward and streak are recomputed/protected by the database trigger. */
  async update(id: string, input: CreateRitualInput): Promise<void> {
    const { error } = await supabase
      .from('rituals')
      .update({
        title: input.title.trim(),
        description: input.description.trim(),
        difficulty: input.difficulty,
        frequency: input.frequency,
      })
      .eq('id', id)
    if (error) throw error
  },

  /** Rituals are archived, never deleted, so their history is preserved. */
  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('rituals')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  /** Brings an archived ritual back to the active list. */
  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('rituals')
      .update({ archived_at: null })
      .eq('id', id)
    if (error) throw error
  },

  /**
   * Without a date the server uses "today" in the user's time zone; it also
   * accepts yesterday (`date` as YYYY-MM-DD) and rejects anything else.
   */
  async complete(id: string, date?: string): Promise<CompleteResult> {
    const { data, error } = await supabase.rpc('complete_ritual', {
      p_ritual_id: id,
      ...(date ? { p_date: date } : {}),
    })
    if (error) throw error
    return data as CompleteResult
  },

  async undo(id: string): Promise<CompleteResult> {
    const { data, error } = await supabase.rpc('undo_ritual', {
      p_ritual_id: id,
    })
    if (error) throw error
    return data as CompleteResult
  },

  /** Imports a backup in one transaction on the server (import_backup RPC). */
  async importBackup(backup: ExportData): Promise<ImportResult> {
    const { data, error } = await supabase.rpc('import_backup', {
      p_backup: { rituals: backup.rituals, logs: backup.logs },
    })
    if (error) throw error
    return data as ImportResult
  },

  /** Full history for exports, read page by page (never truncated). */
  async listAllLogs(userId: string): Promise<RitualLog[]> {
    const rows = await fetchAllPages<LogRow>((from, to) =>
      supabase
        .from('ritual_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('protected', false)
        .order('date', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to),
    )
    return rows.map(mapLog)
  },
}
