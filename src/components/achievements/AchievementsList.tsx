import { AlertCircle, Lock, Trophy, Unlock } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { useI18n, type TranslationKey } from "@/i18n";
import { formatDateTime } from "@/utils/dates";
import type { Achievement } from "@/types";
import Loading from "@/components/animations/Loading";

const RARITY_STYLES = {
  common: "border-zinc-700 text-zinc-300",
  rare: "border-blue-500/40 text-blue-400",
  legendary: "border-yellow-500/40 text-yellow-400",
} as const;

const CATEGORY_LABELS: Record<Achievement["category"], TranslationKey> = {
  streak: "achievements.category.streak",
  essence: "achievements.category.essence",
  rituals: "achievements.category.rituals",
  social: "achievements.category.social",
  special: "achievements.category.special",
};

export function AchievementsList() {
  const { achievements, unlockedCount, isLoading, error, refetch } = useAchievements();
  const { t, locale } = useI18n();

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center"
      >
        <AlertCircle className="mx-auto mb-2 text-red-500" size={24} aria-hidden="true" />
        <h2 className="font-display text-lg font-bold text-white">
          {t("achievements.errorTitle")}
        </h2>
        <p className="mt-1 text-sm text-red-400">{error.message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 transition-colors hover:border-ritual-accent hover:text-ritual-accent"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        {unlockedCount} / {achievements.length} {t("achievements.unlocked").toLowerCase()}
      </p>

      {(Object.keys(CATEGORY_LABELS) as Achievement["category"][]).map((category) => {
        const items = achievements.filter((achievement) => achievement.category === category);
        if (items.length === 0) return null;

        return (
          <section key={category} aria-label={t(CATEGORY_LABELS[category])}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
              {t(CATEGORY_LABELS[category])}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((achievement) => {
                const unlocked = Boolean(achievement.unlockedAt);
                const progress = Math.min(
                  100,
                  Math.round((achievement.progress / achievement.target) * 100),
                );

                return (
                  <article
                    key={achievement.id}
                    className={`rounded-xl border bg-zinc-950 p-4 ${
                      unlocked ? RARITY_STYLES[achievement.rarity] : "border-zinc-900 opacity-80"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden="true">
                        {achievement.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-white">{achievement.name}</h3>
                          {unlocked ? (
                            <Unlock
                              size={16}
                              className="shrink-0 text-ritual-accent"
                              aria-label={t("achievements.unlocked")}
                            />
                          ) : (
                            <Lock
                              size={16}
                              className="shrink-0 text-zinc-400"
                              aria-label={t("achievements.locked")}
                            />
                          )}
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">{achievement.description}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs uppercase tracking-wider text-zinc-400">
                        <span>
                          {achievement.progress} / {achievement.target}
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
                        <div
                          className={`h-full ${unlocked ? "bg-ritual-accent" : "bg-zinc-600"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {achievement.unlockedAt && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                          <Trophy size={10} aria-hidden="true" />
                          {formatDateTime(achievement.unlockedAt, locale)}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default AchievementsList;
