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
import { AlertCircle, Calendar, Download, TrendingUp, Target } from "lucide-react";
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
  const { rituals, logs, isLoading, error, refetch } = useRituals();
  const { t, locale } = useI18n();
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);

  const filteredLogs = useMemo(() => filterLogsByDays(logs, range), [logs, range]);
  const dailySeries = useMemo(
    () => buildDailySeries(logs, range, new Date(), locale),
    [logs, range, locale],
  );
  const difficultySeries = useMemo(
    () => buildDifficultySeries(rituals, filteredLogs, locale),
    [rituals, filteredLogs, locale],
  );
  const weekdaySeries = useMemo(
    () => buildWeekdaySeries(filteredLogs, locale),
    [filteredLogs, locale],
  );
  const completionRate = useMemo(
    () => calculateCompletionRate(rituals, filteredLogs, range),
    [rituals, filteredLogs, range],
  );

  const handleExport = () => {
    const csv = exportToCSV(rituals, filteredLogs);
    downloadFile(csv, `ritualkiller-analytics-${range}d.csv`, "text/csv;charset=utf-8");
  };

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center"
      >
        <AlertCircle className="mx-auto mb-2 text-red-500" size={24} aria-hidden="true" />
        <h2 className="font-display text-lg font-bold text-white">
          {t("analytics.errorTitle")}
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
              {value} {t("productivity.days")}
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
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
            <Target size={14} aria-hidden="true" /> {t("analytics.rate")}
          </div>
          <div className="font-mono text-2xl text-ritual-accent">
            {Math.round(completionRate)}%
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
            <TrendingUp size={14} aria-hidden="true" /> {t("analytics.completed")}
          </div>
          <div className="font-mono text-2xl text-white">{filteredLogs.length}</div>
        </div>
        <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:col-span-1">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
            <Calendar size={14} aria-hidden="true" /> {t("analytics.range")}
          </div>
          <div className="font-mono text-2xl text-white">
            {range} {t("productivity.days")}
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-300">
          {t("analytics.daily")}
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
                name={t("analytics.completed")}
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
            {t("analytics.weekday")}
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
                <Bar
                  dataKey="Completions"
                  name={t("analytics.completed")}
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-300">
            {t("analytics.byDifficulty")}
          </h2>
          {difficultySeries.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">{t("analytics.noData")}</p>
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
