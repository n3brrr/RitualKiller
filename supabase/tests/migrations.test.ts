import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./support/db";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
});

afterAll(async () => {
  await t.close();
});

describe("migrations", () => {
  it("apply cleanly and enable RLS on every public table", async () => {
    const tables = await t.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'`,
    );
    expect(tables.length).toBeGreaterThan(10);
    expect(tables.filter((table) => !table.relrowsecurity)).toEqual([]);
  });

  it("create profile and settings for new auth users", async () => {
    const id = await t.createUser({ username: "Ana María!" });
    const profile = await t.one<{ username: string; essence: number }>(
      "select username, essence from public.profiles where id = $1",
      [id],
    );
    expect(profile).toEqual({ username: "Ana_Mar_a_", essence: 0 });
    const settings = await t.query(
      "select 1 from public.user_settings where user_id = $1",
      [id],
    );
    expect(settings).toHaveLength(1);
  });

  it("removes every owned row when the auth user is deleted (SEC-09)", async () => {
    const id = await t.createUser();
    await t.as(id, () =>
      t.query(
        "insert into public.rituals (user_id, title, difficulty) values ($1, 'x', 'novice')",
        [id],
      ),
    );
    await t.query("delete from auth.users where id = $1", [id]);
    const left = await t.query(
      `select (select count(*) from public.profiles where id = $1)::int as profiles,
              (select count(*) from public.rituals where user_id = $1)::int as rituals,
              (select count(*) from public.user_settings where user_id = $1)::int as settings`,
      [id],
    );
    expect(left).toEqual([{ profiles: 0, rituals: 0, settings: 0 }]);
  });

  it("keeps the language only in profiles (COD-13)", async () => {
    const columns = await t.query(
      "select 1 from information_schema.columns where table_name = 'user_settings' and column_name = 'locale'",
    );
    expect(columns).toEqual([]);
  });
});
