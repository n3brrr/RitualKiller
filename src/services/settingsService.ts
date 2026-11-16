import { supabase } from "@/lib/supabase";
import type { Locale, UserSettings } from "@/types";

interface SettingsRow {
  user_id: string;
  notifications_enabled: boolean;
  reminder_time: string;
  locale: string;
  timezone: string;
}

function mapSettings(row: SettingsRow): UserSettings {
  return {
    userId: row.user_id,
    notificationsEnabled: row.notifications_enabled,
    reminderTime: row.reminder_time.slice(0, 5),
    locale: (row.locale === "en" ? "en" : "es") as Locale,
    timezone: row.timezone,
  };
}

/** IANA time zone reported by the browser, e.g. "Europe/Madrid". */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export const settingsService = {
  /**
   * Keeps user_settings.timezone in line with the device so the server computes
   * "today", streaks and reminders in the user's local day.
   */
  async syncTimezone(userId: string, current: string): Promise<boolean> {
    const timezone = browserTimeZone();
    if (timezone === current) return false;
    const { error } = await supabase
      .from("user_settings")
      .update({ timezone })
      .eq("user_id", userId);
    if (error) throw error;
    return true;
  },

  async get(userId: string): Promise<UserSettings> {
    const { error: insertError } = await supabase
      .from("user_settings")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
    if (insertError) throw insertError;

    const { data, error } = await supabase
      .from("user_settings")
      .select("user_id, notifications_enabled, reminder_time, locale, timezone")
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    return mapSettings(data as SettingsRow);
  },

  async update(
    userId: string,
    updates: Partial<
      Pick<UserSettings, "notificationsEnabled" | "reminderTime" | "locale">
    >,
  ): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (updates.notificationsEnabled !== undefined) {
      payload.notifications_enabled = updates.notificationsEnabled;
    }
    if (updates.reminderTime !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(updates.reminderTime)) {
        throw new Error("Hora de recordatorio inválida");
      }
      payload.reminder_time = updates.reminderTime;
    }
    if (updates.locale !== undefined) payload.locale = updates.locale;
    if (Object.keys(payload).length === 0) return;

    const { error } = await supabase
      .from("user_settings")
      .update(payload)
      .eq("user_id", userId);
    if (error) throw error;
  },
};
