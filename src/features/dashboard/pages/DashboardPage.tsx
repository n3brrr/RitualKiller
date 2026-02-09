import React, { lazy, Suspense } from "react";
import { Heatmap } from "@/components/Heatmap";
import { Zap, Flame, Clock, Check, AlertCircle, Trophy } from "lucide-react";
import Loading from "@/components/animations/Loading";
import { ritualService } from "@/services/api/ritualService";
import { useLoaderData } from "react-router-dom";
import { Ritual, RitualLog } from "@/types";

// Carga diferida (lazy loading) de componentes grandes para mejorar el rendimiento de la página
const AchievementsList = lazy(
  () => import("@/components/achievements/AchievementsList"),
);
const AdvancedAnalytics = lazy(
  () => import("@/components/analytics/AdvancedAnalytics"),
);
const RitualCalendar = lazy(
  () => import("@/components/calendar/RitualCalendar"),
);
const ProductivityMetrics = lazy(
  () => import("@/components/productivity/ProductivityMetrics"),
);

import { useAuthStore } from "@/features/auth/stores/useAuthStore";

// Loader para Dashboard
export const dashboardLoader = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return { rituals: [], logs: [] };

  const [rituals, logs] = await Promise.all([
    ritualService.getRituals(user.id),
    ritualService.getLogs(user.id),
  ]);
  return { rituals, logs };
};

const Dashboard = () => {
  const { rituals: loadedRituals, logs: loadedLogs } = useLoaderData() as {
    rituals: Ritual[];
    logs: RitualLog[];
  };
  const user = useAuthStore((state) => state.user);

  // Use loaded data if available, fallback to empty (Zustand will sync if needed)
  const rituals = loadedRituals || [];
  const logs = loadedLogs || [];

  if (!user) return null; // Si no hay usuario autenticado, no se muestra el dashboard

  // Calcula la fecha actual en formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0] || "";
  // Filtra los logs para los rituales completados hoy
  const todaysLogs = logs.filter((l) => l.date === todayStr);
  // Guarda los IDs de rituales ya completados hoy en un Set para rápida comprobación
  const completedIds = new Set(todaysLogs.map((l) => l.ritualId));

  const activeRituals = rituals.length;
  const completedCount = completedIds.size;
  // Porcentaje de alineación diaria (rituales completados respecto al total activos)
  const completionRate =
    activeRituals > 0 ? Math.round((completedCount / activeRituals) * 100) : 0;

  // Rituals pendientes para hoy
  const pendingRituals = rituals.filter((r) => !completedIds.has(r.id));

  // Mejor racha conseguida por el usuario (streak máximo)
  const bestStreak = rituals.reduce((max, r) => Math.max(max, r.streak), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-1">
            Tu Altar
          </h2>
          <p className="text-zinc-500">
            Bienvenido de vuelta,{" "}
            <span className="text-ritual-accent">{user.username}</span>.
          </p>
        </div>
        <div className="text-left md:text-right">
          <div className="text-4xl font-display font-bold text-zinc-200">
            {completionRate}%
          </div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest">
            Alineación Diaria
          </div>
        </div>
      </header>

      {/* Sección de estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50">
          <div className="text-zinc-500 text-xs uppercase mb-1">
            Esencia Total
          </div>
          <div className="text-2xl font-mono text-ritual-accent">
            {user.essence}
          </div>
        </div>
        <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50">
          <div className="text-zinc-500 text-xs uppercase mb-1">
            Rituales Activos
          </div>
          <div className="text-2xl font-mono text-white">{activeRituals}</div>
        </div>
        <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50">
          <div className="text-zinc-500 text-xs uppercase mb-1">
            Mejor Racha
          </div>
          <div className="text-2xl font-mono text-white flex items-center gap-2">
            {bestStreak}{" "}
            <Zap size={20} className="text-yellow-500 fill-yellow-500/20" />
          </div>
        </div>
        <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50">
          <div className="text-zinc-500 text-xs uppercase mb-1">Inventario</div>
          <div className="text-2xl font-mono text-white">
            {user.inventory.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sección: Heatmap de consistencia diaria */}
        <div className="lg:col-span-2 bg-zinc-950/50 border border-zinc-900 p-6 rounded-2xl h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Flame size={16} className="text-ritual-blood" />
              Gráfico de Consistencia
            </h3>
          </div>
          <Heatmap logs={logs} />
        </div>

        {/* Sección: Calendario de rituales */}
        <div className="bg-zinc-950/50 border border-zinc-900 p-6 rounded-2xl h-fit">
          <Suspense fallback={<Loading />}>
            <RitualCalendar />
          </Suspense>
        </div>

        {/* Sección: Rituals pendientes de completar hoy */}
        <div className="bg-zinc-950/50 border border-zinc-900 p-6 rounded-2xl h-full flex flex-col">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-6">
            <Clock size={16} className="text-ritual-accent" />
            Sacrificios Pendientes
          </h3>

          <div className="space-y-3 flex-1">
            {/* Mensaje de todos los rituales completados */}
            {pendingRituals.length === 0 && activeRituals > 0 && (
              <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg p-4">
                <Check size={24} className="text-ritual-accent mb-2" />
                <span className="text-sm">
                  Todos los sacrificios completados.
                  <br />
                  Descansa ahora, iniciado.
                </span>
              </div>
            )}
            {/* Mensaje si no hay rituales activos */}
            {activeRituals === 0 && (
              <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg p-4">
                <AlertCircle size={24} className="mb-2" />
                <span className="text-sm">
                  No hay rituales establecidos.
                  <br />
                  Visita el Grimorio.
                </span>
              </div>
            )}

            {/* Listado de rituales pendientes para hoy */}
            {pendingRituals.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center p-3 bg-zinc-900/30 border-l-2 border-zinc-800 hover:border-ritual-accent/50 transition-colors rounded-r-lg"
              >
                <div>
                  <div className="text-zinc-200 font-medium text-sm">
                    {r.title}
                  </div>
                  <div className="text-zinc-600 text-xs">
                    +{r.essenceReward} Esencia
                  </div>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                    r.difficulty === "master"
                      ? "border-red-900/30 text-red-500/70"
                      : r.difficulty === "adept"
                        ? "border-yellow-900/30 text-yellow-500/70"
                        : "border-green-900/30 text-green-500/70"
                  }`}
                >
                  {r.difficulty === "novice"
                    ? "Novato"
                    : r.difficulty === "adept"
                      ? "Intermedio"
                      : "Maestro"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección: Métricas de productividad */}
      <div className="mt-8">
        <Suspense fallback={<Loading />}>
          <ProductivityMetrics />
        </Suspense>
      </div>

      {/* Sección: Analíticas avanzadas */}
      <div className="mt-8">
        <Suspense fallback={<Loading />}>
          <AdvancedAnalytics />
        </Suspense>
      </div>

      {/* Sección: Logros */}
      <div className="mt-8">
        <Suspense fallback={<Loading />}>
          <AchievementsList />
        </Suspense>
      </div>
    </div>
  );
};

export default Dashboard;
