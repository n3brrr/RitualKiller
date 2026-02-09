import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Calendar, TrendingUp, Target, Zap } from "lucide-react";
import { useAuthStore } from "../../features/auth/stores/useAuthStore";
import { useRitualStore } from "../../features/rituals/stores/useRitualStore";

const AdvancedAnalytics: React.FC = () => {
  const { rituals, logs } = useRitualStore();
  const user = useAuthStore((state) => state.user);

  // Genera la información de progreso semanal, agrupando logs de los últimos 7 días por semana
  const weeklyData = useMemo(() => {
    const weeks: { [key: string]: number } = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const weekKey = `Semana ${date.getWeek()}`;
      weeks[weekKey] = 0;
    }

    logs.forEach((log) => {
      const logDate = new Date(log.date);
      const weekKey = `Semana ${logDate.getWeek()}`;
      if (weeks[weekKey] !== undefined) {
        weeks[weekKey]++;
      }
    });

    return Object.entries(weeks).map(([name, completions]) => ({
      name,
      Completados: completions,
    }));
  }, [logs]);

  // Calcula la distribución de finalizaciones por dificultad de ritual
  const difficultyData = useMemo(() => {
    const distribution: { [key: string]: number } = {
      novice: 0,
      adept: 0,
      master: 0,
    };

    rituals.forEach((ritual) => {
      // Suma las veces que este ritual ha sido completado, agrupando por dificultad
      const completed = logs.filter((l) => l.ritualId === ritual.id).length;
      distribution[ritual.difficulty] += completed;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name:
        name === "novice"
          ? "Novato"
          : name === "adept"
            ? "Intermedio"
            : "Maestro",
      Completados: value,
    }));
  }, [rituals, logs]);

  // Agrupa los logs de finalización por mes de los últimos 6 meses
  const monthlyData = useMemo(() => {
    const months: { [key: string]: number } = {};
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("es-ES", { month: "short" });
      months[monthKey] = 0;
    }

    logs.forEach((log) => {
      const logDate = new Date(log.date);
      const monthKey = logDate.toLocaleDateString("es-ES", { month: "short" });
      if (months[monthKey] !== undefined) {
        months[monthKey]++;
      }
    });

    return Object.entries(months).map(([name, completions]) => ({
      name,
      Completados: completions,
    }));
  }, [logs]);

  // Agrupa por día de la semana en que se hacen más rituales
  const dayOfWeekData = useMemo(() => {
    const days: { [key: string]: number } = {
      Lun: 0,
      Mar: 0,
      Mié: 0,
      Jue: 0,
      Vie: 0,
      Sáb: 0,
      Dom: 0,
    };

    logs.forEach((log) => {
      const date = new Date(log.date);
      const dayKey = date.toLocaleDateString("es-ES", { weekday: "short" });
      if (days[dayKey] !== undefined) {
        days[dayKey]++;
      }
    });

    return Object.entries(days).map(([name, completions]) => ({
      name,
      Completados: completions,
    }));
  }, [logs]);

  const COLORS = ["#22c55e", "#eab308", "#ef4444"];

  // Cálculo simple del ratio de completitud (número de logs respecto a la cantidad de rituales activos por 30 días)
  const completionRate =
    rituals.length > 0 ? (logs.length / (rituals.length * 30)) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="text-ritual-accent" size={24} />
        <h2 className="text-2xl font-display font-bold">Analytics Avanzados</h2>
      </div>

      {/* Tarjetas de estadística generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <div className="text-zinc-500 text-xs uppercase mb-1">
            Tasa de Completitud
          </div>
          <div className="text-2xl font-mono text-ritual-accent">
            {completionRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <div className="text-zinc-500 text-xs uppercase mb-1">
            Total Completados
          </div>
          <div className="text-2xl font-mono text-white">{logs.length}</div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <div className="text-zinc-500 text-xs uppercase mb-1">
            Rituales Activos
          </div>
          <div className="text-2xl font-mono text-white">{rituals.length}</div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <div className="text-zinc-500 text-xs uppercase mb-1">
            Mejor Racha
          </div>
          <div className="text-2xl font-mono text-white">
            {Math.max(...rituals.map((r) => r.streak || 0), 0)}
          </div>
        </div>
      </div>

      {/* Gráfico de línea de progreso semanal */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-ritual-accent" />
          Progreso Semanal
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" stroke="#71717a" />
            <YAxis stroke="#71717a" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Completados"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: "#22c55e", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras por tendencia mensual */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Tendencias Mensuales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="Completados" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico circular de distribución por dificultad */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">
            Distribución por Dificultad
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="Completados"
              >
                {difficultyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de barras para identificar el día más productivo de la semana */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target size={20} className="text-ritual-accent" />
          Días Más Productivos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dayOfWeekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" stroke="#71717a" />
            <YAxis stroke="#71717a" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="Completados" fill="#22c55e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Agrega método auxiliar al prototipo de Date para extraer el número de la semana en el año
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function () {
  const d = new Date(
    Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export default AdvancedAnalytics;
