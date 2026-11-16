import { useState } from "react";
import { AlertTriangle, Check, ShieldCheck, ShieldOff, Users, X } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/i18n";
import { formatDateTime } from "@/utils/dates";
import Loading from "@/components/animations/Loading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { AdminUser } from "@/types";

export default function AdminPage() {
  const { user } = useAuth();
  const {
    metrics,
    users,
    reports,
    errorLogs,
    isLoading,
    error,
    refetch,
    resolveReport,
    setAdmin,
  } = useAdmin();
  const { t, locale } = useI18n();
  const [adminTarget, setAdminTarget] = useState<AdminUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <Loading />;

  const pendingReports = reports.filter((report) => report.status === "pending");

  const changeAdmin = async (target: AdminUser, isAdmin: boolean) => {
    setActionError(null);
    setBusy(true);
    try {
      await setAdmin({ userId: target.id, isAdmin });
    } catch (adminError) {
      setActionError(
        adminError instanceof Error ? adminError.message : t("admin.roleError"),
      );
    } finally {
      setBusy(false);
      setAdminTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
          <ShieldCheck className="text-ritual-accent" aria-hidden="true" />
          {t("admin.title")}
        </h1>
        <p className="text-sm text-zinc-400">{t("admin.subtitle")}</p>
      </header>

      {(error || actionError) && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            {error && !actionError && (
              <strong className="mr-2">{t("admin.errorTitle")}</strong>
            )}
            {actionError ?? error?.message}
          </span>
          {error && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-red-500/40 px-4 text-sm text-red-300 hover:bg-red-500/10"
            >
              {t("common.retry")}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label={t("admin.users")} value={metrics?.users ?? 0} />
        <Metric label={t("admin.rituals")} value={metrics?.rituals ?? 0} />
        <Metric label={t("admin.completions")} value={metrics?.completions ?? 0} />
        <Metric label={t("admin.active")} value={metrics?.activeUsers7d ?? 0} />
        <Metric label={t("admin.reports")} value={metrics?.pendingReports ?? 0} danger />
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
          <AlertTriangle size={16} className="text-yellow-500" aria-hidden="true" />
          {t("admin.reports")} ({pendingReports.length})
        </h2>
        {pendingReports.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            {t("admin.noPendingReports")}
          </p>
        ) : (
          <ul className="space-y-2">
            {pendingReports.map((report) => (
              <li
                key={report.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-900 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <p className="text-zinc-300">
                    <strong>{report.reporterName}</strong>: {report.reason}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-zinc-400">
                    {report.postId
                      ? `${t("admin.reportPost")} ${report.postId.slice(0, 8)}`
                      : t("admin.reportUser")}{" "}
                    · {formatDateTime(report.createdAt, locale)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void resolveReport({ id: report.id, status: "resolved" })
                    }
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-ritual-accent/40 px-3 text-xs font-bold text-ritual-accent"
                  >
                    <Check size={14} aria-hidden="true" /> {t("admin.resolve")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void resolveReport({ id: report.id, status: "dismissed" })
                    }
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-zinc-700 px-3 text-xs text-zinc-400"
                  >
                    <X size={14} aria-hidden="true" /> {t("admin.dismiss")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
          <Users size={16} aria-hidden="true" /> {t("admin.users")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-400">
                <th className="py-2 pr-3">{t("admin.tableUser")}</th>
                <th className="py-2 pr-3">{t("admin.tableEssence")}</th>
                <th className="py-2 pr-3">{t("admin.tableRole")}</th>
                <th className="py-2">{t("admin.tableAction")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-b border-zinc-900 last:border-0">
                  <td className="py-2 pr-3 text-zinc-200">
                    {item.username}
                    {item.id === user?.id && (
                      <span className="ml-2 text-xs text-zinc-400">{t("admin.you")}</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 font-mono text-ritual-accent">
                    {item.essence}
                  </td>
                  <td className="py-2 pr-3 text-zinc-400">
                    {item.isAdmin ? t("admin.roleAdmin") : t("admin.roleUser")}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() =>
                        item.isAdmin ? setAdminTarget(item) : void changeAdmin(item, true)
                      }
                      disabled={item.id === user?.id}
                      className={`inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-xs disabled:opacity-40 ${
                        item.isAdmin
                          ? "border-red-500/40 text-red-400"
                          : "border-ritual-accent/40 text-ritual-accent"
                      }`}
                    >
                      {item.isAdmin ? (
                        <ShieldOff size={14} aria-hidden="true" />
                      ) : (
                        <ShieldCheck size={14} aria-hidden="true" />
                      )}
                      {item.isAdmin ? t("admin.revoke") : t("admin.grant")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">
          {t("admin.lastErrors")} ({errorLogs.length})
        </h2>
        {errorLogs.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">{t("admin.noErrors")}</p>
        ) : (
          <ul className="space-y-2">
            {errorLogs.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-zinc-900 p-3 text-sm"
              >
                <p className="break-words text-zinc-300">{entry.message}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-zinc-400">
                  {formatDateTime(entry.createdAt, locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(adminTarget)}
        title={t("admin.revokeTitle")}
        description={
          <>
            {t("admin.revokePrompt")}{" "}
            <strong className="text-zinc-200">{adminTarget?.username}</strong>?
          </>
        }
        confirmLabel={t("admin.revokeLabel")}
        destructive
        busy={busy}
        onConfirm={() => {
          if (adminTarget) void changeAdmin(adminTarget, false);
        }}
        onClose={() => setAdminTarget(null)}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-1 text-xs uppercase tracking-wider text-zinc-400">{label}</div>
      <div
        className={`font-mono text-2xl ${danger && value > 0 ? "text-red-400" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}
