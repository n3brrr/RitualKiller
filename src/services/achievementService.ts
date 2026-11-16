import { supabase } from "@/lib/supabase";

interface AchievementRow {
  achievement_id: string;
  unlocked_at: string;
}

export const achievementService = {
  async listUnlocked(userId: string): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId);
    if (error) throw error;
    return Object.fromEntries(
      ((data ?? []) as AchievementRow[]).map((row) => [
        row.achievement_id,
        row.unlocked_at,
      ]),
    );
  },

  async unlockMissing(
    userId: string,
    achievements: Array<{ id: string; name: string }>,
  ): Promise<void> {
    if (achievements.length === 0) return;

    const { data: existing, error: existingError } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId)
      .in(
        "achievement_id",
        achievements.map((achievement) => achievement.id),
      );
    if (existingError) throw existingError;

    const unlocked = new Set(
      ((existing ?? []) as Array<{ achievement_id: string }>).map(
        (row) => row.achievement_id,
      ),
    );
    const missing = achievements.filter((achievement) => !unlocked.has(achievement.id));
    if (missing.length === 0) return;

    const { error: insertError } = await supabase.from("user_achievements").upsert(
      missing.map((achievement) => ({
        user_id: userId,
        achievement_id: achievement.id,
      })),
      { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
    );
    if (insertError) throw insertError;

    const { error: notificationError } = await supabase.from("notifications").insert(
      missing.map((achievement) => ({
        user_id: userId,
        type: "achievement",
        title: "Logro desbloqueado",
        message: achievement.name,
      })),
    );
    if (notificationError) throw notificationError;
  },
};
