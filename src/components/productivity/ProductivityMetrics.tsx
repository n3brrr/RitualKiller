import React, { useMemo } from "react";
import { Clock, Target, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { ProductivityMetrics as ProductivityMetricsType } from "../../types";
import { useAuthStore } from "../../features/auth/stores/useAuthStore";
import { useRitualStore } from "../../features/rituals/stores/useRitualStore";

const ProductivityMetrics: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { rituals, logs } = useRitualStore();

  const metrics: ProductivityMetricsType = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Calculate daily efficiency
    const todayLogs = logs.filter((l) => l.date === todayStr);
    const dailyEfficiency =
      rituals.length > 0 ? (todayLogs.length / rituals.length) * 100 : 0;

    // Calculate weekly efficiency
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLogs = logs.filter((l) => {
      const logDate = new Date(l.date);
      return logDate >= weekAgo;
    });
    const weeklyEfficiency =
      rituals.length > 0 ? (weekLogs.length / (rituals.length * 7)) * 100 : 0;

    // Average completion rate
    const totalPossible = rituals.length * 30; // Last 30 days
    const averageCompletionRate =
      totalPossible > 0 ? (logs.length / totalPossible) * 100 : 0;

    // Best day (most completions)
    const dayCounts: { [key: string]: number } = {};
    if (logs.length === 0) {
      return {
        dailyEfficiency,
        weeklyEfficiency,
        averageCompletionRate,
        bestDay: "N/A",
        ritualsCompleted: 0,
        streakDays: 0,
      };
    }

    logs.forEach((log) => {
      dayCounts[log.date] = (dayCounts[log.date] || 0) + 1;
    });

    // Find the entry with max count
    let maxDate = "";
    let maxCount = -1;

    Object.entries(dayCounts).forEach(([date, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxDate = date;
      }
    });

    const bestDay = maxDate
      ? new Date(maxDate).toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "short",
        })
      : "N/A";

    // Rituals completed
    const ritualsCompleted = logs.length;

    // Streak days
    const maxStreak = Math.max(...rituals.map((r) => r.streak || 0), 0);

    return {
      dailyEfficiency,
      weeklyEfficiency,
      averageCompletionRate,
      bestDay,
      ritualsCompleted,
      streakDays: maxStreak,
    };
  }, [rituals, logs]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="text-ritual-accent" size={24} />
        <h2 className="text-2xl font-display font-bold">
          Métricas de Productividad
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-ritual-accent/10 rounded-lg">
              <Clock className="text-ritual-accent" size={20} />
            </div>
            <div className="text-zinc-500 text-xs uppercase">
              Eficiencia Diaria
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-white mb-2">
            {metrics.dailyEfficiency.toFixed(1)}%
          </div>
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-ritual-accent transition-all duration-500"
              style={{ width: `${Math.min(metrics.dailyEfficiency, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <TrendingUp className="text-yellow-500" size={20} />
            </div>
            <div className="text-zinc-500 text-xs uppercase">
              Eficiencia Semanal
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-white mb-2">
            {metrics.weeklyEfficiency.toFixed(1)}%
          </div>
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${Math.min(metrics.weeklyEfficiency, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Target className="text-purple-500" size={20} />
            </div>
            <div className="text-zinc-500 text-xs uppercase">Tasa Promedio</div>
          </div>
          <div className="text-3xl font-mono font-bold text-white mb-2">
            {metrics.averageCompletionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-zinc-500">Últimos 30 días</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Zap className="text-blue-500" size={20} />
            </div>
            <div className="text-zinc-500 text-xs uppercase">Mejor Día</div>
          </div>
          <div className="text-lg font-bold text-white">{metrics.bestDay}</div>
          <div className="text-xs text-zinc-500 mt-1">
            {
              logs.filter(
                (l) =>
                  l.date ===
                  Object.keys(
                    logs.reduce((acc: { [key: string]: number }, log) => {
                      acc[log.date] = (acc[log.date] || 0) + 1;
                      return acc;
                    }, {}),
                  ).reduce((a, b) =>
                    logs.filter((l) => l.date === a).length >
                    logs.filter((l) => l.date === b).length
                      ? a
                      : b,
                  ),
              ).length
            }{" "}
            completados
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-ritual-accent/50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-ritual-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-zinc-500 text-sm mb-2 relative z-10">
            Rituales Completados
          </div>
          <div className="text-2xl font-mono font-bold text-white relative z-10">
            {metrics.ritualsCompleted}
          </div>
          <div className="text-xs text-zinc-500 mt-1 relative z-10">
            Total histórico
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-zinc-500 text-sm mb-2 relative z-10">
            Días de Racha
          </div>
          <div className="text-2xl font-mono font-bold text-yellow-500 relative z-10">
            {metrics.streakDays}
          </div>
          <div className="text-xs text-zinc-500 mt-1 relative z-10">
            Mejor racha actual
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="text-ritual-accent" size={20} />
          Insights Personalizados
        </h3>
        <div className="space-y-3">
          {metrics.dailyEfficiency >= 80 && (
            <div className="p-3 bg-ritual-accent/10 border border-ritual-accent/30 rounded-lg">
              <p className="text-sm text-ritual-accent">
                ✨ Excelente trabajo hoy. Mantén este ritmo para alcanzar tus
                objetivos.
              </p>
            </div>
          )}
          {metrics.weeklyEfficiency < 50 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-500">
                ⚠️ Tu eficiencia semanal está por debajo del 50%. Considera
                ajustar tus rituales.
              </p>
            </div>
          )}
          {metrics.streakDays >= 7 && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-500">
                🔥 Racha impresionante de {metrics.streakDays} días. ¡Sigue así!
              </p>
            </div>
          )}
          {rituals.length === 0 && (
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <p className="text-sm text-zinc-400">
                💡 Crea tu primer ritual para comenzar a rastrear tu
                productividad.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductivityMetrics;
