import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const root = resolve(__dirname, "..", "..");
const migrationsDir = join(root, "migrations");

export type Role = "anon" | "authenticated" | "service_role";

export interface TestDb {
  db: PGlite;
  /** Runs `fn` as the given user through the `authenticated` role (RLS applies). */
  as<T>(userId: string | null, fn: () => Promise<T>, role?: Role): Promise<T>;
  /** Inserts an auth user; the handle_new_user trigger creates profile + settings. */
  createUser(options?: {
    username?: string;
    email?: string;
    admin?: boolean;
  }): Promise<string>;
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  one<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T>;
  close(): Promise<void>;
}

let counter = 0;

export async function createTestDb(): Promise<TestDb> {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(readFileSync(join(__dirname, "supabase-stub.sql"), "utf8"));

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }

  const query = async <T>(sql: string, params: unknown[] = []) =>
    (await db.query<T>(sql, params)).rows;

  const testDb: TestDb = {
    db,
    query,
    async one<T>(sql: string, params: unknown[] = []) {
      const rows = await query<T>(sql, params);
      if (rows.length === 0) throw new Error(`No rows for: ${sql}`);
      return rows[0] as T;
    },
    async as<T>(
      userId: string | null,
      fn: () => Promise<T>,
      role: Role = "authenticated",
    ) {
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
        userId ?? "",
      ]);
      const effectiveRole = userId === null && role === "authenticated" ? "anon" : role;
      await db.exec(`set role ${effectiveRole}`);
      try {
        return await fn();
      } finally {
        await db.exec("reset role");
        await db.query("select set_config('request.jwt.claim.sub', '', false)");
      }
    },
    async createUser(options = {}) {
      counter += 1;
      const id = crypto.randomUUID();
      await db.query(
        "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)",
        [
          id,
          options.email ?? `user${counter}@example.com`,
          JSON.stringify({ username: options.username ?? `user_${counter}` }),
        ],
      );
      if (options.admin) {
        await db.query("update public.profiles set is_admin = true where id = $1", [id]);
      }
      return id;
    },
    close: () => db.close(),
  };
  return testDb;
}

/** Asserts that `promise` rejects, optionally matching the error message. */
export async function expectError(promise: Promise<unknown>, match?: RegExp) {
  let failed = false;
  try {
    await promise;
  } catch (error) {
    failed = true;
    if (match && !match.test((error as Error).message)) {
      throw new Error(`Expected error ${match} but got: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }
  if (!failed) throw new Error("Expected the operation to fail, but it succeeded");
}
