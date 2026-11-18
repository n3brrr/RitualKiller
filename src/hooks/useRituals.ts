import { useMemo } from 'react'
import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import {
  ritualService,
  type CompleteResult,
  type CreateRitualInput,
  type RitualBundle,
} from '@/services/ritualService'
import { buildCompletionIndex } from '@/utils/analytics'
import { addDays, dateFromKey, toDateKey } from '@/utils/dates'
import type { ExportData } from '@/utils/exportImport'

const TOGGLE_KEY = ['rituals', 'toggle'] as const

interface ToggleContext {
  previous: RitualBundle | undefined
}

/** Replaces the optimistic log with the real one and refreshes the streak. */
function applyCompletion(
  bundle: RitualBundle,
  ritualId: string,
  result: CompleteResult,
): RitualBundle {
  const streak = result.streak ?? 0
  return {
    ...bundle,
    rituals: bundle.rituals.map((ritual) =>
      ritual.id === ritualId
        ? { ...ritual, streak, bestStreak: Math.max(ritual.bestStreak, streak) }
        : ritual,
    ),
    logs: bundle.logs.map((log) =>
      log.id === `optimistic-${ritualId}`
        ? {
            ...log,
            id: result.log_id ?? log.id,
            date: result.date ?? log.date,
            essence_gained: result.essence_gained ?? 0,
          }
        : log,
    ),
  }
}

export function useRituals() {
  const { user } = useAuth()
  const userId = user?.id
  const queryClient = useQueryClient()
  const ritualsKey = ['rituals', userId] as const

  const query = useQuery({
    queryKey: ritualsKey,
    queryFn: () => ritualService.list(userId!),
    enabled: Boolean(userId),
  })

  const invalidateRelated = () => {
    void queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    void queryClient.invalidateQueries({ queryKey: ['goals', userId] })
    void queryClient.invalidateQueries({ queryKey: ['achievements', userId] })
    void queryClient.invalidateQueries({ queryKey: ['stats', userId] })
    void queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  }

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['rituals', userId] })
    invalidateRelated()
  }

  /**
   * Optimistic toggle: the check mark flips immediately (a temporary log for
   * today) and is rolled back if the server refuses or fails.
   */
  const optimisticToggle = (
    completing: boolean,
  ): Pick<
    UseMutationOptions<CompleteResult, Error, string, ToggleContext>,
    'onMutate' | 'onError' | 'onSuccess' | 'onSettled'
  > => ({
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ritualsKey })
      const previous = queryClient.getQueryData<RitualBundle>(ritualsKey)
      if (previous) {
        const today = previous.today
        const logs = completing
          ? [
              ...previous.logs,
              {
                id: `optimistic-${id}`,
                ritualId: id,
                user_id: userId ?? '',
                date: today,
                essence_gained: 0,
                protected: false,
              },
            ]
          : previous.logs.filter(
              (log) => !(log.ritualId === id && log.date === today),
            )
        queryClient.setQueryData<RitualBundle>(ritualsKey, {
          ...previous,
          logs,
        })
      }
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous)
        queryClient.setQueryData(ritualsKey, context.previous)
    },
    onSuccess: (result, id, context) => {
      if (!result.success && context?.previous) {
        queryClient.setQueryData(ritualsKey, context.previous)
      }
      // A completion already tells us the log and the new streak, so the
      // (large) ritual bundle is patched instead of downloaded again.
      if (completing && result.success) {
        queryClient.setQueryData<RitualBundle>(ritualsKey, (bundle) =>
          bundle ? applyCompletion(bundle, id, result) : bundle,
        )
      }
    },
    onSettled: (result, error) => {
      const patched = completing && !error && result?.success
      if (!patched) void queryClient.invalidateQueries({ queryKey: ritualsKey })
      invalidateRelated()
    },
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateRitualInput) =>
      ritualService.create(userId!, input),
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateRitualInput }) =>
      ritualService.update(id, input),
    onSuccess: invalidate,
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => ritualService.archive(id),
    onSuccess: invalidate,
  })

  const completeMutation = useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: (id: string): Promise<CompleteResult> =>
      ritualService.complete(id),
    ...optimisticToggle(true),
  })

  const undoMutation = useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: (id: string): Promise<CompleteResult> => ritualService.undo(id),
    ...optimisticToggle(false),
  })

  const restoreMutation = useMutation({
    mutationFn: (id: string) => ritualService.restore(id),
    onSuccess: invalidate,
  })

  // Fills yesterday (the server only accepts today or yesterday).
  const completeYesterdayMutation = useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: (id: string): Promise<CompleteResult> => {
      const today = queryClient.getQueryData<RitualBundle>(ritualsKey)?.today
      const base = today ? dateFromKey(today) : new Date()
      return ritualService.complete(id, toDateKey(addDays(base, -1)))
    },
    onSettled: invalidate,
  })

  const importMutation = useMutation({
    mutationFn: (backup: ExportData) => ritualService.importBackup(backup),
    onSuccess: invalidate,
  })

  // Ritual ids with a complete/undo in flight, shared by every component.
  const pendingIds = useMutationState({
    filters: { mutationKey: TOGGLE_KEY, status: 'pending' },
    select: (mutation) => mutation.state.variables as string,
  })

  const today = query.data?.today ?? toDateKey()
  const todayDate = useMemo(() => dateFromKey(today), [today])
  const logs = useMemo(() => query.data?.logs ?? [], [query.data])
  const completionIndex = useMemo(() => buildCompletionIndex(logs), [logs])

  return {
    rituals: query.data?.rituals ?? [],
    archivedRituals: query.data?.archived ?? [],
    logs,
    /** "Today" in the user's server-side time zone (YYYY-MM-DD). */
    today,
    /** Same day as a local Date, ready for the completion helpers. */
    todayDate,
    /** Map ritualId -> set of completed dates, for O(1) "done?" checks. */
    completionIndex,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
    createRitual: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateRitual: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    archiveRitual: archiveMutation.mutateAsync,
    restoreRitual: restoreMutation.mutateAsync,
    completeRitual: completeMutation.mutateAsync,
    completeYesterday: completeYesterdayMutation.mutateAsync,
    undoRitual: undoMutation.mutateAsync,
    isPending: (id: string) => pendingIds.includes(id),
    importBackup: importMutation.mutateAsync,
  }
}
