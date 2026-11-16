import type { Achievement, Rarity } from "../types";

/**
 * Server metrics (my_stats()) that achievements are measured against. The
 * targets mirror supabase achievement_definitions: the server grants the
 * achievement, the client only displays progress.
 */
export type AchievementMetric =
  | "best_streak"
  | "lifetime_essence"
  | "rituals_created"
  | "completions"
  | "posts"
  | "perfect_days"
  | "difficulties";

export interface AchievementDefinition {
  id: string;
  icon: string;
  rarity: Rarity;
  target: number;
  category: Achievement["category"];
  metric: AchievementMetric;
}

export type UserStats = Record<AchievementMetric, number>;

export const EMPTY_STATS: UserStats = {
  best_streak: 0,
  lifetime_essence: 0,
  rituals_created: 0,
  completions: 0,
  posts: 0,
  perfect_days: 0,
  difficulties: 0,
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "ach-streak-7",
    icon: "🔥",
    rarity: "common",
    target: 7,
    category: "streak",
    metric: "best_streak",
  },
  {
    id: "ach-streak-30",
    icon: "👑",
    rarity: "rare",
    target: 30,
    category: "streak",
    metric: "best_streak",
  },
  {
    id: "ach-streak-100",
    icon: "💀",
    rarity: "legendary",
    target: 100,
    category: "streak",
    metric: "best_streak",
  },
  {
    id: "ach-essence-1000",
    icon: "💎",
    rarity: "common",
    target: 1000,
    category: "essence",
    metric: "lifetime_essence",
  },
  {
    id: "ach-essence-10000",
    icon: "⚡",
    rarity: "rare",
    target: 10000,
    category: "essence",
    metric: "lifetime_essence",
  },
  {
    id: "ach-essence-50000",
    icon: "🌟",
    rarity: "legendary",
    target: 50000,
    category: "essence",
    metric: "lifetime_essence",
  },
  {
    id: "ach-rituals-10",
    icon: "📜",
    rarity: "common",
    target: 10,
    category: "rituals",
    metric: "rituals_created",
  },
  {
    id: "ach-rituals-50",
    icon: "📚",
    rarity: "rare",
    target: 50,
    category: "rituals",
    metric: "rituals_created",
  },
  {
    id: "ach-complete-100",
    icon: "🏆",
    rarity: "rare",
    target: 100,
    category: "rituals",
    metric: "completions",
  },
  {
    id: "ach-social-first",
    icon: "📢",
    rarity: "common",
    target: 1,
    category: "social",
    metric: "posts",
  },
  {
    id: "ach-social-10",
    icon: "📱",
    rarity: "common",
    target: 10,
    category: "social",
    metric: "posts",
  },
  {
    id: "ach-perfect-week",
    icon: "✨",
    rarity: "rare",
    target: 7,
    category: "special",
    metric: "perfect_days",
  },
  {
    id: "ach-all-difficulties",
    icon: "🎯",
    rarity: "rare",
    target: 3,
    category: "special",
    metric: "difficulties",
  },
];

/** Progress never exceeds the achievement target. */
export function achievementProgress(
  achievement: Pick<AchievementDefinition, "metric" | "target">,
  stats: Partial<UserStats>,
): number {
  const value = Number(stats[achievement.metric] ?? 0);
  return Math.max(0, Math.min(Number.isFinite(value) ? value : 0, achievement.target));
}
