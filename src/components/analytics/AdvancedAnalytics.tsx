import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, Download, TrendingUp, Target } from "lucide-react";
import { useRituals } from "@/hooks/useRituals";
import { useI18n } from "@/i18n";
import {
  buildDailySeries,
  buildDifficultySeries,
  buildWeekdaySeries,
  calculateCompletionRate,
  filterLogsByDays,
} from "@/utils/analytics";
import { downloadFile, exportToCSV } from "@/utils/exportImport";
import Loading from "@/components/animations/Loading";

const RANGES = [7, 30, 90] as const;
const COLORS = ["#22c55e", "#eab308", "#ef4444"];

export function AdvancedAnalytics() {
  const { rituals, logs, isLoading } = useRituals();
  const { t } = useI18n();
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);

  const filteredLogs = useMemo(() => filterLogsByDays(logs, range), [logs, range]);
  const dailySeries = useMemo(
    () => buildDailySeries(logs, range, new Date(), "es"),
    [logs, range],
  );
  const difficultySeries = useMemo(
    () => buildDifficultySeries(rituals, filteredLogs),
    [rituals, filteredLogs],
  );
  const weekdaySeries = useMemo(() => buildWeekdaySeries(filteredLogs), [filteredLogs]);
  const completionRate = useMemo(
    () => calculateCompletionRate(rituals, filteredLogs, range),
    [rituals, filteredLogs, range],
  );

  const handleExport = () => {
    const csv = exportToCSV(rituals, filteredLogs);
    downloadFile(csv, `ritualkiller-analytics-${range}d.csv`, "text/csv;charset=utf-8");
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2" role="group" aria-label={t("analytics.range")}>
          {RANGES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              aria-pressed={range === value}
              className={`min-h-11 rounded-lg border px-4 text-sm font-bold ${
                range === value
                  ? "border-ritual-accent bg-ritual-accent/10 text-ritual-accent"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
              }`}
            >
              {value} días
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-300 hover:border-ritual-accent hover:text-ritual-accent"
        >
          <Download size={16} aria-hidden="true" /> {t("common.export")} CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <Target size={14} aria-hidden="true" /> Tasa
          </div>
          <div className="font-mono text-2xl text-ritual-accent">
            {Math.round(completionRate)}%
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <TrendingUp size={14} aria-hidden="true" /> Completados
          </div>
          <div className="font-mono text-2xl text-white">{filteredLogs.length}</div>
        </div>
        <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:col-span-1">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <Calendar size={14} aria-hidden="true" /> Rango
          </div>
          <div className="font-mono text-2xl text-white">{range} días</div>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-300">
          Completados por día
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
              <YAxis allowDecimals={false} stroke="#71717a" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#09090b", border: "1px solid #27272a" }}
              />
              <Line
                type="monotone"
                dataKey="Completions"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-300">
            Por día de la semana
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdaySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#09090b", border: "1px solid #27272a" }}
                />
                <Bar dataKey="Completions" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-300">
            Por dificultad
          </h2>
          {difficultySeries.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              Sin datos en este rango.
            </p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultySeries}
                    dataKey="Completions"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {difficultySeries.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#09090b", border: "1px solid #27272a" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdvancedAnalytics;
