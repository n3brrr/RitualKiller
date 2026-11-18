import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, expectError, type TestDb } from './support/db'

let t: TestDb
let admin: string
let author: string
let reporter: string

beforeAll(async () => {
  t = await createTestDb()
  admin = await t.createUser({ username: 'warden', admin: true })
  author = await t.createUser({ username: 'Troll_King' })
  reporter = await t.createUser({ username: 'watcher' })
})

afterAll(async () => {
  await t.close()
})

async function post(userId: string, content = 'hello'): Promise<string> {
  const { id } = await t.as(userId, () =>
    t.one<{ id: string }>(
      'insert into public.posts (user_id, content) values ($1, $2) returning id',
      [userId, content],
    ),
  )
  return id
}

describe('moderation (UX-08)', () => {
  it('shows moderators the reported content', async () => {
    const postId = await post(author, 'offensive text')
    await t.as(reporter, () =>
      t.query(
        "insert into public.reports (reporter_id, post_id, reason) values ($1, $2, 'abuse')",
        [reporter, postId],
      ),
    )
    const details = await t.as(admin, () =>
      t.one<Record<string, unknown>>(
        'select reporter_name, post_content, reported_user_name from public.report_details where post_id = $1',
        [postId],
      ),
    )
    expect(details).toEqual({
      reporter_name: 'watcher',
      post_content: 'offensive text',
      reported_user_name: 'Troll_King',
    })
    const asUser = await t.as(reporter, () =>
      t.query(
        'select post_content from public.report_details where post_id = $1',
        [postId],
      ),
    )
    expect(asUser).toEqual([{ post_content: 'offensive text' }])
  })

  it('deletes posts with an audit trail and resolves their reports', async () => {
    const postId = await post(author, 'spam')
    const { id: reportId } = await t.as(reporter, () =>
      t.one<{ id: string }>(
        "insert into public.reports (reporter_id, post_id, reason) values ($1, $2, 'spam') returning id",
        [reporter, postId],
      ),
    )
    await expectError(
      t.as(reporter, () =>
        t.query('select public.admin_delete_post($1)', [postId]),
      ),
      /forbidden/,
    )
    await t.as(admin, () =>
      t.query('select public.admin_delete_post($1, $2)', [postId, reportId]),
    )
    expect(
      await t.query('select 1 from public.posts where id = $1', [postId]),
    ).toEqual([])
    const audit = await t.as(admin, () =>
      t.query<{ action: string; target_user_id: string }>(
        "select action, target_user_id from public.moderation_actions where details ->> 'post_id' = $1",
        [postId],
      ),
    )
    expect(audit).toEqual([{ action: 'delete_post', target_user_id: author }])
  })

  it('suspends users so they cannot post, and lifts it', async () => {
    await t.as(admin, () =>
      t.query('select public.admin_suspend_user($1, 7)', [author]),
    )
    await expectError(post(author), /row-level security/)
    await t.as(admin, () =>
      t.query('select public.admin_suspend_user($1, 0)', [author]),
    )
    expect(await post(author, 'back')).toBeTruthy()
  })

  it('does not let users lift their own suspension or suspend admins', async () => {
    await t.as(admin, () =>
      t.query('select public.admin_suspend_user($1, 3)', [author]),
    )
    await t.as(author, () =>
      t.query(
        'update public.profiles set suspended_until = null where id = $1',
        [author],
      ),
    )
    const { suspended } = await t.one<{ suspended: boolean }>(
      'select public.is_suspended($1) as suspended',
      [author],
    )
    expect(suspended).toBe(true)
    await expectError(
      t.as(admin, () =>
        t.query('select public.admin_suspend_user($1, 3)', [admin]),
      ),
      /cannot suspend/,
    )
  })
})

describe('public profiles (UX-11)', () => {
  it('are found case-insensitively and expose only public aggregates', async () => {
    await t.query(
      "insert into public.inventory (user_id, item_id, quantity) values ($1, 'shadow_amulet', 1)",
      [reporter],
    )
    // The author is suspended by now, so another user follows.
    await t.as(admin, () =>
      t.query(
        'insert into public.follows (follower_id, following_id) values ($1, $2)',
        [admin, reporter],
      ),
    )
    const profile = await t.as(admin, () =>
      t.one<Record<string, unknown>>(
        "select * from public.get_public_profile('WATCHER')",
      ),
    )
    expect(profile).toMatchObject({
      username: 'watcher',
      shadow_amulet: true,
      followers: 1,
      following: 0,
      active_rituals: 0,
    })
    expect(profile).not.toHaveProperty('is_admin')
    expect(profile).not.toHaveProperty('suspended_until')
  })
})
