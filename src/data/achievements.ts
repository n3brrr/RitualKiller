import type { Achievement, Ritual, RitualLog } from "../types";

export type AchievementDefinition = Omit<Achievement, "progress" | "unlockedAt">;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "ach-streak-7",
    name: "First Week",
    description: "Complete all your rituals for 7 consecutive days",
    icon: "🔥",
    rarity: "common",
    target: 7,
    category: "streak",
  },
  {
    id: "ach-streak-30",
    name: "Master of the Month",
    description: "Maintain a 30-day streak without breaking it",
    icon: "👑",
    rarity: "rare",
    target: 30,
    category: "streak",
  },
  {
    id: "ach-streak-100",
    name: "Invincible",
    description: "Reach a 100-day streak",
    icon: "💀",
    rarity: "legendary",
    target: 100,
    category: "streak",
  },
  {
    id: "ach-essence-1000",
    name: "Hoarder",
    description: "Accumulate 1,000 essence",
    icon: "💎",
    rarity: "common",
    target: 1000,
    category: "essence",
  },
  {
    id: "ach-essence-10000",
    name: "Ascended",
    description: "Reach 10,000 accumulated essence",
    icon: "⚡",
    rarity: "rare",
    target: 10000,
    category: "essence",
  },
  {
    id: "ach-essence-50000",
    name: "Demi-God",
    description: "Accumulate 50,000 essence",
    icon: "🌟",
    rarity: "legendary",
    target: 50000,
    category: "essence",
  },
  {
    id: "ach-rituals-10",
    name: "Initiate",
    description: "Create 10 rituals",
    icon: "📜",
    rarity: "common",
    target: 10,
    category: "rituals",
  },
  {
    id: "ach-rituals-50",
    name: "Collector",
    description: "Create 50 different rituals",
    icon: "📚",
    rarity: "rare",
    target: 50,
    category: "rituals",
  },
  {
    id: "ach-complete-100",
    name: "Centurion",
    description: "Complete 100 rituals in total",
    icon: "🏆",
    rarity: "rare",
    target: 100,
    category: "rituals",
  },
  {
    id: "ach-social-first",
    name: "First Voice",
    description: "Publish your first post in the community",
    icon: "📢",
    rarity: "common",
    target: 1,
    category: "social",
  },
  {
    id: "ach-social-10",
    name: "Influencer",
    description: "Publish 10 posts",
    icon: "📱",
    rarity: "common",
    target: 10,
    category: "social",
  },
  {
    id: "ach-perfect-week",
    name: "Perfect Week",
    description: "Complete all rituals every day of the week",
    icon: "✨",
    rarity: "rare",
    target: 7,
    category: "special",
  },
  {
    id: "ach-all-difficulties",
    name: "Complete Master",
    description: "Complete rituals of all difficulties",
    icon: "🎯",
    rarity: "rare",
    target: 3,
    category: "special",
  },
];

interface UserData {
  rituals: Array<Pick<Ritual, "id" | "streak" | "difficulty">>;
  logs: Array<Pick<RitualLog, "ritualId" | "date">>;
  essence: number;
  posts?: unknown[];
}

function longestFullDayRun(userData: UserData): number {
  if (userData.rituals.length === 0) return 0;

  const completionsByDay = new Map<string, Set<string>>();
  for (const log of userData.logs) {
    const date = log.date.slice(0, 10);
    const completed = completionsByDay.get(date) ?? new Set<string>();
    completed.add(log.ritualId);
    completionsByDay.set(date, completed);
  }

  const fullDays = [...completionsByDay.entries()]
    .filter(([, completed]) => completed.size >= userData.rituals.length)
    .map(([date]) => date)
    .sort();

  let best = 0;
  let current = 0;
  let previous: string | null = null;
  for (const date of fullDays) {
    if (previous) {
      const [year, month, day] = previous.split("-").map(Number);
      const next = new Date(year ?? 0, (month ?? 1) - 1, (day ?? 1) + 1);
      const expected = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
      current = expected === date ? current + 1 : 1;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
    previous = date;
  }
  return best;
}

/** Progress never exceeds the achievement target. */
export function calculateAchievementProgress(
  achievement: AchievementDefinition,
  userData: UserData,
): number {
  switch (achievement.category) {
    case "streak": {
      const maxStreak = Math.max(
        ...userData.rituals.map((ritual) => ritual.streak ?? 0),
        0,
      );
      return Math.min(maxStreak, achievement.target);
    }
    case "essence":
      return Math.min(userData.essence, achievement.target);
    case "rituals":
      return Math.min(
        achievement.id.includes("complete")
          ? userData.logs.length
          : userData.rituals.length,
        achievement.target,
      );
    case "social":
      return Math.min(userData.posts?.length ?? 0, achievement.target);
    case "special": {
      if (achievement.id === "ach-perfect-week") {
        return Math.min(longestFullDayRun(userData), achievement.target);
      }
      if (achievement.id === "ach-all-difficulties") {
        const completedIds = new Set(userData.logs.map((log) => log.ritualId));
        const difficulties = new Set(
          userData.rituals
            .filter((ritual) => completedIds.has(ritual.id))
            .map((ritual) => ritual.difficulty),
        );
        return Math.min(difficulties.size, achievement.target);
      }
      return 0;
    }
    default:
      return 0;
  }
}

export function getUnlockedAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.filter(
    (achievement) => achievement.progress >= achievement.target && achievement.unlockedAt,
  );
}
