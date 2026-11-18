import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from './support/db'

let t: TestDb

beforeAll(async () => {
  t = await createTestDb()
})

afterAll(async () => {
  await t.close()
})

interface RpcResult {
  success: boolean
  reason?: string
  essence_gained?: number
  streak?: number
}

async function today(userId: string): Promise<string> {
  const { d } = await t.one<{ d: string }>(
    'select public.user_today($1)::text as d',
    [userId],
  )
  return d
}

/** Creates a ritual dated `daysAgo` days back (as the owner would). */
async function ritual(
  userId: string,
  frequency = 'daily',
  daysAgo = 30,
): Promise<string> {
  const { id } = await t.as(userId, () =>
    t.one<{ id: string }>(
      "insert into public.rituals (user_id, title, difficulty, frequency) values ($1, 'R', 'novice', $2) returning id",
      [userId, frequency],
    ),
  )
  await t.query(
    'update public.rituals set created_at = now() - make_interval(days => $2) where id = $1',
    [id, daysAgo],
  )
  return id
}

/** Seeds history directly (as the server would have written it). */
async function seedLog(userId: string, ritualId: string, daysAgo: number) {
  await t.query(
    'insert into public.ritual_logs (ritual_id, user_id, date, essence_gained) values ($1, $2, public.user_today($2) - $3::int, 10)',
    [ritualId, userId, daysAgo],
  )
}

const complete = (
  userId: string,
  ritualId: string,
  date: string | null = null,
) =>
  t.as(userId, () =>
    t
      .one<{ r: RpcResult }>(
        'select public.complete_ritual($1, $2::date) as r',
        [ritualId, date],
      )
      .then((row) => row.r),
  )

const undo = (userId: string, ritualId: string) =>
  t.as(userId, () =>
    t
      .one<{ r: RpcResult }>('select public.undo_ritual($1) as r', [ritualId])
      .then((row) => row.r),
  )

const essenceOf = async (userId: string) =>
  (
    await t.one<{ essence: number }>(
      'select essence from public.profiles where id = $1',
      [userId],
    )
  ).essence

describe('completion window (SEC-01)', () => {
  it('accepts today and yesterday only', async () => {
    const user = await t.createUser()
    const id = await ritual(user)
    const now = await today(user)
    const past = new Date(`${now}T00:00:00Z`)
    past.setUTCDate(past.getUTCDate() - 5)
    const future = new Date(`${now}T00:00:00Z`)
    future.setUTCDate(future.getUTCDate() + 1)

    expect(
      (await complete(user, id, past.toISOString().slice(0, 10))).reason,
    ).toBe('invalid_date')
    expect(
      (await complete(user, id, future.toISOString().slice(0, 10))).reason,
    ).toBe('invalid_date')
    expect((await complete(user, id)).success).toBe(true)
    expect((await complete(user, id)).reason).toBe('already_completed')
    expect(await essenceOf(user)).toBe(10)
  })

  it('does not allow completing days before the ritual existed', async () => {
    const user = await t.createUser()
    const id = await ritual(user, 'daily', 0)
    const now = new Date(`${await today(user)}T00:00:00Z`)
    now.setUTCDate(now.getUTCDate() - 1)
    expect(
      (await complete(user, id, now.toISOString().slice(0, 10))).reason,
    ).toBe('invalid_date')
  })
})

describe('streaks (COD-02)', () => {
  it('continues a daily streak and pays the bonus', async () => {
    const user = await t.createUser()
    const id = await ritual(user)
    await seedLog(user, id, 2)
    await seedLog(user, id, 1)
    const result = await complete(user, id)
    expect(result).toMatchObject({
      success: true,
      streak: 3,
      essence_gained: 20,
    })
  })

  it('shows a broken streak as 0 instead of the stale value', async () => {
    const user = await t.createUser()
    const id = await ritual(user)
    await seedLog(user, id, 5)
    await seedLog(user, id, 4)
    await t.query('update public.rituals set streak = 2 where id = $1', [id])
    const row = await t.as(user, () =>
      t.one<{ current_streak: number }>(
        'select current_streak from public.rituals_with_streak where id = $1',
        [id],
      ),
    )
    expect(row.current_streak).toBe(0)
  })

  it('counts weekly streaks by week, not by consecutive days', async () => {
    const user = await t.createUser()
    const id = await ritual(user, 'weekly', 60)
    await seedLog(user, id, 7)
    await seedLog(user, id, 14)
    const result = await complete(user, id)
    expect(result.success).toBe(true)
    expect(result.streak).toBe(3)
  })

  it('recomputes the streak on undo and archives keep history (COD-14)', async () => {
    const user = await t.createUser()
    const id = await ritual(user)
    await seedLog(user, id, 1)
    await complete(user, id)
    const undone = await undo(user, id)
    expect(undone).toMatchObject({ success: true, streak: 1 })

    await t.as(user, () =>
      t.query('update public.rituals set archived_at = now() where id = $1', [
        id,
      ]),
    )
    const active = await t.as(user, () =>
      t.query('select 1 from public.rituals_with_streak where id = $1', [id]),
    )
    expect(active).toEqual([])
    const logs = await t.query(
      'select 1 from public.ritual_logs where ritual_id = $1',
      [id],
    )
    expect(logs).toHaveLength(1)
    await expect(complete(user, id)).rejects.toThrow(/ritual not found/)
  })
})

describe('undo guard (SEC-19)', () => {
  it('refuses to undo a completion whose essence was spent', async () => {
    const user = await t.createUser()
    const id = await ritual(user)
    await complete(user, id)
    await t.query('update public.profiles set essence = 0 where id = $1', [
      user,
    ])
    expect((await undo(user, id)).reason).toBe('essence_spent')
  })
})

describe('shop items (COD-03)', () => {
  async function give(userId: string, itemId: string, essence = 0) {
    await t.query(
      'insert into public.inventory (user_id, item_id, quantity) values ($1, $2, 1)',
      [userId, itemId],
    )
    if (essence) {
      await t.query('update public.profiles set essence = $2 where id = $1', [
        userId,
        essence,
      ])
    }
  }

  const consume = (userId: string, itemId: string) =>
    t.as(userId, () =>
      t
        .one<{ r: RpcResult & { restored?: number } }>(
          'select public.consume_item($1) as r',
          [itemId],
        )
        .then((row) => row.r),
    )

  it('keeps passive items and refuses to buy them twice', async () => {
    const user = await t.createUser()
    await give(user, 'shadow_amulet', 10000)
    expect((await consume(user, 'shadow_amulet')).reason).toBe('passive_item')
    const bought = await t.as(user, () =>
      t.one<{ r: RpcResult }>(
        "select public.purchase_item('shadow_amulet') as r",
      ),
    )
    expect(bought.r.reason).toBe('already_owned')
    const owned = await t.query(
      "select quantity from public.inventory where user_id = $1 and item_id = 'shadow_amulet'",
      [user],
    )
    expect(owned).toEqual([{ quantity: 1 }])
  })

  it('fills yesterday with the Potion of Oblivion and keeps the streak', async () => {
    const user = await t.createUser()
    const id = await ritual(user)
    await seedLog(user, id, 3)
    await seedLog(user, id, 2)
    await give(user, 'potion_oblivion')

    const result = await consume(user, 'potion_oblivion')
    expect(result).toMatchObject({ success: true, restored: 1 })
    const filled = await t.one<{ protected: boolean; essence_gained: number }>(
      'select protected, essence_gained from public.ritual_logs where ritual_id = $1 and date = public.user_today($2) - 1',
      [id, user],
    )
    expect(filled).toEqual({ protected: true, essence_gained: 0 })
    expect((await complete(user, id)).streak).toBe(4)
    expect(
      await t.query('select 1 from public.inventory where user_id = $1', [
        user,
      ]),
    ).toEqual([])
  })

  it('does not consume the potion when there is nothing to restore', async () => {
    const user = await t.createUser()
    await give(user, 'potion_oblivion')
    expect((await consume(user, 'potion_oblivion')).reason).toBe(
      'nothing_to_restore',
    )
    expect(
      await t.query(
        'select quantity from public.inventory where user_id = $1',
        [user],
      ),
    ).toEqual([{ quantity: 1 }])
  })
})

describe('time zones (COD-05)', () => {
  it('validates the time zone and uses it for today', async () => {
    const user = await t.createUser()
    await t.as(user, () =>
      t.query(
        "update public.user_settings set timezone = 'Pacific/Kiritimati' where user_id = $1",
        [user],
      ),
    )
    const { local } = await t.one<{ local: string }>(
      "select ((now() at time zone 'Pacific/Kiritimati')::date)::text as local",
    )
    expect(await today(user)).toBe(local)
    await expect(
      t.as(user, () =>
        t.query(
          "update public.user_settings set timezone = 'Mars/Olympus' where user_id = $1",
          [user],
        ),
      ),
    ).rejects.toThrow(/invalid_timezone/)
  })
})
