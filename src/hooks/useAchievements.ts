import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { useRituals } from "@/hooks/useRituals";
import { achievementService } from "@/services/achievementService";
import { socialService } from "@/services/socialService";
import { ACHIEVEMENTS, calculateAchievementProgress } from "@/data/achievements";
import type { Achievement } from "@/types";

export function useAchievements() {
  const { user } = useAuth();
  const userId = user?.id;
  const { rituals, logs, isLoading: ritualsLoading } = useRituals();
  const queryClient = useQueryClient();
  const attempted = useRef(new Set<string>());

  const postsQuery = useQuery({
    queryKey: ["social", "count", userId],
    queryFn: () => socialService.countPosts(userId!),
    enabled: Boolean(userId),
  });

  const unlockedQuery = useQuery({
    queryKey: ["achievements", userId],
    queryFn: () => achievementService.listUnlocked(userId!),
    enabled: Boolean(userId),
  });

  const unlocked = useMemo(() => unlockedQuery.data ?? {}, [unlockedQuery.data]);

  const achievements = useMemo<Achievement[]>(() => {
    const posts = Array.from({ length: postsQuery.data ?? 0 });
    return ACHIEVEMENTS.map((achievement) => {
      const progress = calculateAchievementProgress(achievement, {
        rituals,
        logs,
        essence: user?.essence ?? 0,
        posts,
      });
      return {
        ...achievement,
        progress,
        unlockedAt:
          unlocked[achievement.id] ??
          (progress >= achievement.target ? new Date().toISOString() : undefined),
      } as Achievement;
    });
  }, [rituals, logs, user?.essence, postsQuery.data, unlocked]);

  const missing = useMemo(
    () =>
      achievements.filter(
        (achievement) =>
          achievement.progress >= achievement.target && !unlocked[achievement.id],
      ),
    [achievements, unlocked],
  );
  const missingKey = missing.map((achievement) => achievement.id).join("|");

  const unlockMutation = useMutation({
    mutationFn: (items: Array<{ id: string; name: string }>) =>
      achievementService.unlockMissing(userId!, items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["achievements", userId] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });

  useEffect(() => {
    if (!userId || !missingKey || ritualsLoading || unlockedQuery.isLoading) return;
    const fresh = missing.filter((achievement) => !attempted.current.has(achievement.id));
    if (fresh.length === 0) return;
    fresh.forEach((achievement) => attempted.current.add(achievement.id));
    void unlockMutation
      .mutateAsync(fresh.map(({ id, name }) => ({ id, name })))
      .catch((error) => console.error("No se pudieron guardar los logros:", error));
    // missingKey representa el contenido de missing; attempted evita reenvíos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey, userId, ritualsLoading, unlockedQuery.isLoading]);

  return {
    achievements,
    unlockedCount: achievements.filter((achievement) => achievement.unlockedAt).length,
    isLoading: ritualsLoading || unlockedQuery.isLoading || postsQuery.isLoading,
    error: (unlockedQuery.error as Error | null) ?? null,
    refetch: unlockedQuery.refetch,
  };
}
