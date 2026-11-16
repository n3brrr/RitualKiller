import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { ActiveBuff, Locale, User } from "@/types";
import { getRank } from "@/utils/rank";
import { validateUsername } from "@/utils/validation";

interface ProfileRow {
  id: string;
  username: string;
  avatar_url: string | null;
  essence: number;
  is_admin: boolean;
  locale: string;
  created_at: string;
}

interface InventoryRow {
  item_id: string;
  quantity: number;
}

interface BuffRow {
  id: string;
  item_id: string;
  multiplier: number;
  expires_at: string;
}

function mapRole(essence: number): string {
  return getRank(essence).title;
}

function sanitizeUsername(value: string): string {
  const clean = value
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .slice(0, 24);
  return clean.length >= 2 ? clean : "initiate";
}

async function createProfile(user: SupabaseUser): Promise<ProfileRow> {
  const base = sanitizeUsername(
    (user.user_metadata?.username as string | undefined) ??
      user.email?.split("@")[0] ??
      "initiate",
  );

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const username =
      attempt === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await supabase
      .from("profiles")
      .insert({ id: user.id, username })
      .select("*")
      .single();
    if (!error) {
      await supabase.from("user_settings").insert({ user_id: user.id });
      return data as ProfileRow;
    }
    if (error.code !== "23505") throw error;

    // El trigger pudo crear el perfil entre la lectura y el insert.
    const { data: raced } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (raced) return raced as ProfileRow;
  }

  throw new Error("No se pudo crear el perfil");
}

export const profileService = {
  async getProfile(user: SupabaseUser): Promise<User> {
    const { data: existing, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;

    const profile = (existing as ProfileRow | null) ?? (await createProfile(user));

    const [
      { data: inventory, error: inventoryError },
      { data: buffs, error: buffsError },
    ] = await Promise.all([
      supabase.from("inventory").select("item_id, quantity").eq("user_id", user.id),
      supabase
        .from("active_buffs")
        .select("id, item_id, multiplier, expires_at")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString()),
    ]);

    if (inventoryError) throw inventoryError;
    if (buffsError) throw buffsError;

    const inventoryIds = ((inventory ?? []) as InventoryRow[]).flatMap((row) =>
      Array.from({ length: Math.max(0, row.quantity) }, () => row.item_id),
    );

    const activeBuffs: ActiveBuff[] = ((buffs ?? []) as BuffRow[]).map((buff) => ({
      id: buff.id,
      itemId: buff.item_id,
      expiresAt: new Date(buff.expires_at).getTime(),
      multiplier: Number(buff.multiplier),
    }));

    return {
      id: profile.id,
      username: profile.username,
      essence: profile.essence,
      rank: mapRole(profile.essence),
      inventory: inventoryIds,
      avatar_url: profile.avatar_url,
      locale: (profile.locale === "en" ? "en" : "es") as Locale,
      created_at: profile.created_at,
      isAdmin: profile.is_admin,
      active_buffs: activeBuffs,
    };
  },

  async updateProfile(
    userId: string,
    updates: { username?: string; avatar_url?: string | null; locale?: Locale },
  ): Promise<void> {
    const payload: Record<string, unknown> = {};

    if (updates.username !== undefined) {
      const validation = validateUsername(updates.username);
      if (!validation.valid) throw new Error(validation.message);
      payload.username = updates.username.trim();
    }

    if (updates.avatar_url !== undefined) {
      const value = updates.avatar_url?.trim() ?? "";
      if (value) {
        let parsed: URL;
        try {
          parsed = new URL(value);
        } catch {
          throw new Error("La URL del avatar no es válida");
        }
        if (parsed.protocol !== "https:" || value.length > 500) {
          throw new Error("La URL del avatar no es válida");
        }
        payload.avatar_url = value;
      } else {
        payload.avatar_url = null;
      }
    }

    if (updates.locale !== undefined) payload.locale = updates.locale;
    if (Object.keys(payload).length === 0) return;

    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error) throw error;
  },

  /** Other users are read through the public_profiles view (no private columns). */
  async getByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("public_profiles")
      .select("id, username, avatar_url, essence, created_at")
      .eq("username", username)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const profile = data as Pick<
      ProfileRow,
      "id" | "username" | "avatar_url" | "essence" | "created_at"
    >;
    return {
      id: profile.id,
      username: profile.username,
      essence: profile.essence,
      rank: mapRole(profile.essence),
      inventory: [],
      avatar_url: profile.avatar_url,
      locale: "es",
      created_at: profile.created_at,
      isAdmin: false,
      active_buffs: [],
    };
  },

  async deleteMyData(): Promise<void> {
    const { error } = await supabase.rpc("delete_my_data");
    if (error) throw error;
  },
};
