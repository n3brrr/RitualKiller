import React, { useMemo } from "react";
import { Trophy, Lock, Unlock } from "lucide-react";
import { Achievement, Rarity } from "../../types";
import {
  ACHIEVEMENTS,
  calculateAchievementProgress,
  getUnlockedAchievements,
} from "../../data/achievements";
import { useAuthStore } from "../../features/auth/stores/useAuthStore";
import { useRitualStore } from "../../features/rituals/stores/useRitualStore";

const AchievementsList: React.FC = () => {
  // Obtener datos del usuario y rituales desde los stores globales
  const user = useAuthStore((state) => state.user);
  const { rituals, logs } = useRitualStore();

  // Calcula el progreso real de cada logro para el usuario actual
  const achievementsWithProgress = useMemo(() => {
    if (!user) return [];

    return ACHIEVEMENTS.map((ach) => {
      const progress = calculateAchievementProgress(ach, {
        rituals,
        logs,
        essence: user.essence,
      });

      return {
        ...ach,
        progress,
        unlockedAt:
          progress >= ach.target ? new Date().toISOString() : undefined,
      } as Achievement;
    });
  }, [user, rituals, logs]);

  // Filtra los logros desbloqueados y bloqueados
  const unlocked = getUnlockedAchievements(achievementsWithProgress);
  const locked = achievementsWithProgress.filter((a) => !a.unlockedAt);

  // Devuelve clases de color según la rareza del logro
  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "rare":
        return "border-purple-500/50 bg-purple-500/10";
      default:
        return "border-zinc-500/50 bg-zinc-500/10";
    }
  };

  // Devuelve color de texto para los badges según la rareza
  const getRarityTextColor = (rarity: Rarity) => {
    switch (rarity) {
      case "legendary":
        return "text-yellow-500";
      case "rare":
        return "text-purple-500";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="text-ritual-accent" size={24} />
          <h2 className="text-2xl font-display font-bold">Logros</h2>
        </div>
        <div className="text-sm text-zinc-500">
          {unlocked.length} / {achievementsWithProgress.length} Desbloqueados
        </div>
      </div>

      {/* Sección de logros desbloqueados */}
      {unlocked.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Unlock size={16} />
            Desbloqueados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {unlocked.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-zinc-950 border-2 rounded-xl p-5 ${getRarityColor(achievement.rarity)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <span
                    className={`text-xs px-2 py-1 rounded border ${getRarityTextColor(achievement.rarity)} border-current`}
                  >
                    {achievement.rarity === "common"
                      ? "Común"
                      : achievement.rarity === "rare"
                        ? "Raro"
                        : "Legendario"}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white mb-1">
                  {achievement.name}
                </h3>
                <p className="text-zinc-400 text-sm mb-3">
                  {achievement.description}
                </p>
                {achievement.unlockedAt && (
                  <div className="text-xs text-ritual-accent">
                    Desbloqueado:{" "}
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección de logros bloqueados con barra de progreso */}
      {locked.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Lock size={16} />
            Bloqueados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((achievement) => {
              const progressPercent =
                (achievement.progress / achievement.target) * 100;

              return (
                <div
                  key={achievement.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 opacity-60"
                >
                  <div className="flex items-start justify-between mb-3">
                    {/* Icono en escala de grises para indicar que está bloqueado */}
                    <div className="text-4xl grayscale">{achievement.icon}</div>
                    <span className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-600">
                      {achievement.rarity === "common"
                        ? "Común"
                        : achievement.rarity === "rare"
                          ? "Raro"
                          : "Legendario"}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-zinc-500 mb-1">
                    {achievement.name}
                  </h3>
                  <p className="text-zinc-600 text-sm mb-3">
                    {achievement.description}
                  </p>

                  {/* Barra de progreso visual para el logro */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Progreso</span>
                      <span>
                        {achievement.progress} / {achievement.target}
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ritual-accent transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsList;
