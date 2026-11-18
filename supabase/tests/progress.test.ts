import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, expectError, type TestDb } from './support/db'

let t: TestDb

beforeAll(async () => {
  t = await createTestDb()
})

afterAll(async () => {
  await t.close()
})

async function ritual(
  userId: string,
  title = 'R',
  frequency = 'daily',
): Promise<string> {
  const { id } = await t.as(userId, () =>
    t.one<{ id: string }>(
      "insert into public.rituals (user_id, title, difficulty, frequency) values ($1, $2, 'novice', $3) returning id",
      [userId, title, frequency],
    ),
  )
  await t.query(
    "update public.rituals set created_at = now() - interval '60 days' where id = $1",
    [id],
  )
  return id
}

const complete = (userId: string, ritualId: string) =>
  t.as(userId, () => t.query('select public.complete_ritual($1)', [ritualId]))

const stats = (userId: string) =>
  t.as(userId, () =>
    t
      .one<{ s: Record<string, number> }>('select public.my_stats() as s')
      .then((row) => row.s),
  )

const unlocked = async (userId: string) =>
  (
    await t.query<{ achievement_id: string }>(
      'select achievement_id from public.user_achievements where user_id = $1 order by 1',
      [userId],
    )
  ).map((row) => row.achievement_id)

describe('lifetime essence and stats (COD-06, COD-01)', () => {
  it('accumulates essence that does not drop when spending', async () => {
    const user = await t.createUser()
    const id = await ritual(user)
    await complete(user, id)
    await t.query('update public.profiles set essence = 0 where id = $1', [
      user,
    ])
    const result = await stats(user)
    expect(result.lifetime_essence).toBe(10)
    expect(result.completions).toBe(1)
    expect(result.rituals_created).toBe(1)
  })
})

describe('server-side achievements (SEC-06, COD-06)', () => {
  it('unlocks and notifies once when a target is met', async () => {
    const user = await t.createUser()
    for (let index = 0; index < 10; index += 1) await ritual(user, `R${index}`)
    expect(await unlocked(user)).toContain('ach-rituals-10')

    const notifications = await t.query<{
      type: string
      data: { achievementId: string }
    }>(
      "select type, data from public.notifications where user_id = $1 and type = 'achievement'",
      [user],
    )
    expect(notifications).toEqual([
      { type: 'achievement', data: { achievementId: 'ach-rituals-10' } },
    ])

    await ritual(user, 'R10')
    expect(
      (await unlocked(user)).filter((id) => id === 'ach-rituals-10'),
    ).toHaveLength(1)
  })

  it('unlocks social achievements when posting', async () => {
    const user = await t.createUser()
    await t.as(user, () =>
      t.query(
        "insert into public.posts (user_id, content) values ($1, 'hello')",
        [user],
      ),
    )
    expect(await unlocked(user)).toContain('ach-social-first')
  })
})

describe('goals (COD-07)', () => {
  it('counts only linked completions made since the goal was created', async () => {
    const user = await t.createUser()
    const linked = await ritual(user, 'Linked')
    const other = await ritual(user, 'Other')
    await t.query(
      'insert into public.ritual_logs (ritual_id, user_id, date, essence_gained) values ($1, $2, public.user_today($2) - 10, 10)',
      [linked, user],
    )

    const { id } = await t.as(user, () =>
      t.one<{ id: string }>(
        "select public.save_goal(null, 'Goal', '', public.user_today($1) + 30, 5, array[$2]::uuid[]) as id",
        [user, linked],
      ),
    )
    await complete(user, linked)
    await complete(user, other)

    const goal = await t.as(user, () =>
      t.one<{ progress: number; ritual_ids: string[] }>(
        'select progress, ritual_ids from public.goals_with_progress where id = $1',
        [id],
      ),
    )
    expect(goal).toEqual({ progress: 1, ritual_ids: [linked] })
  })

  it('rejects rituals of other users and direct writes', async () => {
    const user = await t.createUser()
    const intruder = await t.createUser()
    const foreign = await ritual(intruder)
    await expectError(
      t.as(user, () =>
        t.query(
          "select public.save_goal(null, 'Goal', '', current_date + 1, 5, array[$1]::uuid[])",
          [foreign],
        ),
      ),
      /invalid_ritual/,
    )
    await expectError(
      t.as(user, () =>
        t.query(
          "insert into public.goals (user_id, title, target_date) values ($1, 'x', current_date)",
          [user],
        ),
      ),
      /row-level security/,
    )
  })
})

describe('backup import (COD-09)', () => {
  const backup = {
    rituals: [
      { id: 'old-1', title: 'Read', difficulty: 'master', frequency: 'daily' },
      { id: 'bad', title: '', difficulty: 'novice', frequency: 'daily' },
    ],
    logs: [
      { ritualId: 'old-1', date: '2026-01-01', essence_gained: 99999 },
      { ritualId: 'old-1', date: 'not-a-date' },
      { ritualId: 'missing', date: '2026-01-02' },
      { ritualId: 'old-1', date: '2999-01-01' },
    ],
  }

  it('imports valid data, skips the rest and is idempotent', async () => {
    const user = await t.createUser()
    const run = () =>
      t.as(user, () =>
        t
          .one<{ r: Record<string, number> }>(
            'select public.import_backup($1::jsonb) as r',
            [JSON.stringify(backup)],
          )
          .then((row) => row.r),
      )

    expect(await run()).toEqual({ rituals: 1, reused: 0, logs: 1, skipped: 4 })
    expect(await run()).toEqual({ rituals: 0, reused: 1, logs: 0, skipped: 4 })

    const rituals = await t.query<{
      difficulty: string
      essence_reward: number
    }>(
      'select difficulty, essence_reward from public.rituals where user_id = $1',
      [user],
    )
    expect(rituals).toEqual([{ difficulty: 'adept', essence_reward: 25 }])

    const result = await stats(user)
    expect(result.completions).toBe(0)
    expect(result.lifetime_essence).toBe(0)
  })

  it('rejects oversized backups', async () => {
    const user = await t.createUser()
    const huge = {
      rituals: [],
      logs: Array.from({ length: 20001 }, () => ({})),
    }
    await expectError(
      t.as(user, () =>
        t.query('select public.import_backup($1::jsonb)', [
          JSON.stringify(huge),
        ]),
      ),
      /backup_too_large/,
    )
  })
})
