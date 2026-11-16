import type { User as SupabaseUser } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
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

export const profileService = {
  async getProfile(user: SupabaseUser): Promise<User> {
    const { data: existing, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;

    // handle_new_user creates the profile on sign-up; the client never does.
    if (!existing) throw new AppError("profile.createError");
    const profile = existing as ProfileRow;

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
      if (!validation.valid) {
        throw new AppError(validation.messageKey ?? "auth.invalidUsername");
      }
      payload.username = updates.username.trim();
    }

    if (updates.avatar_url !== undefined) {
      const value = updates.avatar_url?.trim() ?? "";
      if (value) {
        let parsed: URL;
        try {
          parsed = new URL(value);
        } catch {
          throw new AppError("settings.avatarInvalid");
        }
        if (parsed.protocol !== "https:" || value.length > 500) {
          throw new AppError("settings.avatarInvalid");
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

  /** Deletes the auth account through the delete-account Edge Function. */
  async deleteAccount(): Promise<void> {
    const { error } = await supabase.functions.invoke("delete-account", {
      method: "POST",
    });
    if (error) throw error;
  },
};
