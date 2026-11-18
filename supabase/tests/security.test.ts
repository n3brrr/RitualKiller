import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, expectError, type TestDb } from './support/db'

let t: TestDb
let alice: string
let bob: string
let admin: string

beforeAll(async () => {
  t = await createTestDb()
  alice = await t.createUser({ username: 'alice' })
  bob = await t.createUser({ username: 'bob' })
  admin = await t.createUser({ username: 'root', admin: true })
})

afterAll(async () => {
  await t.close()
})

async function createRitual(userId: string, difficulty = 'novice', extra = '') {
  return t.as(userId, () =>
    t.one<{ id: string; essence_reward: number; streak: number }>(
      `insert into public.rituals (user_id, title, difficulty ${extra ? ', essence_reward, streak' : ''})
       values ($1, 'Ritual', $2 ${extra ? `, ${extra}` : ''})
       returning id, essence_reward, streak`,
      [userId, difficulty],
    ),
  )
}

describe('economy tables are server-owned', () => {
  it('rejects direct inventory writes (SEC-02)', async () => {
    await expectError(
      t.as(alice, () =>
        t.query(
          "insert into public.inventory (user_id, item_id, quantity) values ($1, 'binding_contract', 99)",
          [alice],
        ),
      ),
      /row-level security/,
    )
  })

  it('rejects forged buffs (SEC-03)', async () => {
    await expectError(
      t.as(alice, () =>
        t.query(
          `insert into public.active_buffs (user_id, item_id, multiplier, expires_at)
           values ($1, 'x', 99, now() + interval '100 years')`,
          [alice],
        ),
      ),
      /row-level security/,
    )
  })

  it('rejects direct ritual log writes (SEC-05)', async () => {
    const ritual = await createRitual(alice)
    await expectError(
      t.as(alice, () =>
        t.query(
          'insert into public.ritual_logs (ritual_id, user_id, date, essence_gained) values ($1, $2, current_date, 9999)',
          [ritual.id, alice],
        ),
      ),
      /row-level security/,
    )
  })

  it('rejects self-granted achievements and notifications (SEC-06)', async () => {
    await expectError(
      t.as(alice, () =>
        t.query(
          "insert into public.user_achievements (user_id, achievement_id) values ($1, 'ach-streak-100')",
          [alice],
        ),
      ),
      /row-level security/,
    )
    await expectError(
      t.as(alice, () =>
        t.query(
          "insert into public.notifications (user_id, title, message) values ($1, 'x', 'y')",
          [alice],
        ),
      ),
      /row-level security/,
    )
  })

  it('lets users only mark notifications as read', async () => {
    const { id } = await t.one<{ id: string }>(
      "insert into public.notifications (user_id, title, message) values ($1, 't', 'm') returning id",
      [alice],
    )
    await t.as(alice, () =>
      t.query('update public.notifications set read = true where id = $1', [
        id,
      ]),
    )
    await expectError(
      t.as(alice, () =>
        t.query(
          "update public.notifications set message = 'forged' where id = $1",
          [id],
        ),
      ),
      /permission denied/,
    )
  })
})

describe('rituals', () => {
  it('computes the reward and ignores client streaks (SEC-04)', async () => {
    const ritual = await createRitual(alice, 'novice', '1000, 100')
    expect(ritual.essence_reward).toBe(10)
    expect(ritual.streak).toBe(0)

    const updated = await t.as(alice, () =>
      t.one<{ essence_reward: number; streak: number }>(
        `update public.rituals set essence_reward = 1000, streak = 50, frequency = 'weekly'
         where id = $1 returning essence_reward, streak`,
        [ritual.id],
      ),
    )
    expect(updated).toEqual({ essence_reward: 30, streak: 0 })
  })

  it('requires the Binding Contract for new master rituals (COD-03)', async () => {
    await expectError(
      createRitual(alice, 'master'),
      /binding_contract_required/,
    )
    await t.query(
      "insert into public.inventory (user_id, item_id, quantity) values ($1, 'binding_contract', 1)",
      [bob],
    )
    const ritual = await createRitual(bob, 'master')
    expect(ritual.essence_reward).toBe(50)
  })
})

describe('profiles', () => {
  it('lets the economy RPCs change essence (COD-20)', async () => {
    const ritual = await createRitual(alice)
    await t.as(alice, () =>
      t.query('select public.complete_ritual($1)', [ritual.id]),
    )
    const { essence } = await t.one<{ essence: number }>(
      'select essence from public.profiles where id = $1',
      [alice],
    )
    expect(essence).toBeGreaterThan(0)
  })

  it('still blocks direct essence and admin changes', async () => {
    await t.as(alice, () =>
      t.query(
        'update public.profiles set essence = 999999, is_admin = true where id = $1',
        [alice],
      ),
    )
    const profile = await t.one<{ essence: number; is_admin: boolean }>(
      'select essence, is_admin from public.profiles where id = $1',
      [alice],
    )
    expect(profile.essence).toBeLessThan(999999)
    expect(profile.is_admin).toBe(false)
  })

  it('hides private columns of other users (SEC-16)', async () => {
    const own = await t.as(bob, () =>
      t.query('select id from public.profiles where id = $1', [alice]),
    )
    expect(own).toEqual([])
    const visible = await t.as(bob, () =>
      t.one<Record<string, unknown>>(
        'select * from public.public_profiles where id = $1',
        [alice],
      ),
    )
    expect(visible).not.toHaveProperty('is_admin')
    expect(visible).not.toHaveProperty('locale')
    expect(visible).not.toHaveProperty('suspended_until')
    expect(visible).toHaveProperty('username', 'alice')
    const asAnon = await t.as(null, () =>
      t.query('select 1 from public.profiles').catch(() => []),
    )
    expect(asAnon).toEqual([])
  })

  it('only accepts https avatars (SEC-11)', async () => {
    await expectError(
      t.as(alice, () =>
        t.query(
          "update public.profiles set avatar_url = 'http://evil.test/x.png' where id = $1",
          [alice],
        ),
      ),
      /profiles_avatar_url_https/,
    )
  })
})

describe('social', () => {
  it('prevents forged system posts (SEC-08)', async () => {
    await expectError(
      t.as(alice, () =>
        t.query(
          "insert into public.posts (user_id, content, is_system) values ($1, 'hi', true)",
          [alice],
        ),
      ),
      /row-level security/,
    )
    await t.as(admin, () =>
      t.query(
        "insert into public.posts (user_id, content, is_system) values ($1, 'news', true)",
        [admin],
      ),
    )
  })

  it('rate limits posts and deduplicates reports (SEC-15)', async () => {
    for (let index = 0; index < 10; index += 1) {
      await t.as(bob, () =>
        t.query('insert into public.posts (user_id, content) values ($1, $2)', [
          bob,
          `post ${index}`,
        ]),
      )
    }
    await expectError(
      t.as(bob, () =>
        t.query(
          "insert into public.posts (user_id, content) values ($1, 'spam')",
          [bob],
        ),
      ),
      /rate_limited/,
    )

    const { id } = await t.one<{ id: string }>(
      'select id from public.posts where user_id = $1 limit 1',
      [bob],
    )
    await t.as(alice, () =>
      t.query(
        "insert into public.reports (reporter_id, post_id, reason) values ($1, $2, 'spam')",
        [alice, id],
      ),
    )
    await expectError(
      t.as(alice, () =>
        t.query(
          "insert into public.reports (reporter_id, post_id, reason) values ($1, $2, 'again')",
          [alice, id],
        ),
      ),
      /duplicate key/,
    )
  })
})

describe('observability and functions', () => {
  it('rejects anonymous and oversized error logs (SEC-14)', async () => {
    await expectError(
      t.as(null, () =>
        t.query("insert into public.error_logs (message) values ('x')"),
      ),
    )
    await expectError(
      t.as(alice, () =>
        t.query(
          'insert into public.error_logs (user_id, message) values ($1, $2)',
          [alice, 'x'.repeat(3000)],
        ),
      ),
      /error_logs_message_len/,
    )
  })

  it('does not let anonymous callers execute RPCs (SEC-17)', async () => {
    await expectError(
      t.as(null, () => t.query('select public.admin_metrics()')),
      /permission denied/,
    )
  })
})
