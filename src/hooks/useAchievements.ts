import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { useStats } from "@/hooks/useStats";
import { achievementService } from "@/services/achievementService";
import { ACHIEVEMENTS, EMPTY_STATS, achievementProgress } from "@/data/achievements";
import type { Achievement } from "@/types";

/** Progress comes from server stats; unlocking happens only on the server. */
export function useAchievements() {
  const { user } = useAuth();
  const userId = user?.id;
  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useStats();

  const unlockedQuery = useQuery({
    queryKey: ["achievements", userId],
    queryFn: () => achievementService.listUnlocked(userId!),
    enabled: Boolean(userId),
  });

  const achievements = useMemo<Achievement[]>(() => {
    const unlocked = unlockedQuery.data ?? {};
    return ACHIEVEMENTS.map((definition) => {
      const unlockedAt = unlocked[definition.id];
      return {
        id: definition.id,
        icon: definition.icon,
        rarity: definition.rarity,
        target: definition.target,
        category: definition.category,
        progress: unlockedAt
          ? definition.target
          : achievementProgress(definition, stats ?? EMPTY_STATS),
        ...(unlockedAt ? { unlockedAt } : {}),
      };
    });
  }, [stats, unlockedQuery.data]);

  return {
    achievements,
    unlockedCount: achievements.filter((achievement) => achievement.unlockedAt).length,
    isLoading: statsLoading || unlockedQuery.isLoading,
    error: ((unlockedQuery.error as Error | null) ?? statsError) || null,
    refetch: () => {
      void refetchStats();
      return unlockedQuery.refetch();
    },
  };
}
