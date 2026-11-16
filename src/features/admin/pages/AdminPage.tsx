import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/features/auth/useAuth";
import { useI18n, type TranslationKey } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/utils/dates";
import { ADMIN_USERS_PAGE } from "@/services/adminService";
import Loading from "@/components/animations/Loading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { AdminUser, Report } from "@/types";

const SUSPENSION_DAYS = 7;

/** Every sensitive action goes through a confirmation dialog. */
type PendingAction =
  | { kind: "grant" | "revoke"; user: AdminUser }
  | { kind: "deletePost"; report: Report }
  | {
      kind: "suspend" | "unsuspend";
      userId: string;
      name: string;
      reportId: string | null;
    };

export default function AdminPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const {
    metrics,
    users,
    usersTotal,
    usersFetching,
    reports,
    errorLogs,
    isLoading,
    error,
    refetch,
    resolveReport,
    setAdmin,
    deletePost,
    suspendUser,
  } = useAdmin(search, page);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <Loading />;

  const pendingReports = reports.filter((report) => report.status === "pending");
  const pageCount = Math.max(1, Math.ceil(usersTotal / ADMIN_USERS_PAGE));
  const isSuspended = (until: string | null) =>
    Boolean(until && new Date(until).getTime() > Date.now());

  const run = async (action: () => Promise<unknown>) => {
    setActionError(null);
    setBusy(true);
    try {
      await action();
    } catch (failure) {
      setActionError(errorMessage(failure, t));
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const confirmPending = () => {
    if (!pending) return;
    switch (pending.kind) {
      case "grant":
      case "revoke":
        void run(() =>
          setAdmin({ userId: pending.user.id, isAdmin: pending.kind === "grant" }),
        );
        break;
      case "deletePost":
        if (pending.report.postId) {
          const postId = pending.report.postId;
          void run(() => deletePost({ postId, reportId: pending.report.id }));
        }
        break;
      case "suspend":
      case "unsuspend":
        void run(() =>
          suspendUser({
            userId: pending.userId,
            days: pending.kind === "suspend" ? SUSPENSION_DAYS : 0,
            reportId: pending.reportId,
          }),
        );
        break;
    }
  };

  const dialog = pending ? describeAction(pending) : null;

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
            {actionError ?? errorMessage(error, t)}
          </span>
          {error && (
            <button
              type="button"
              onClick={refetch}
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
          <ul className="space-y-3">
            {pendingReports.map((report) => (
              <li
                key={report.id}
                className="space-y-2 rounded-lg border border-zinc-900 p-3 text-sm"
              >
                <p className="text-zinc-300">
                  <strong>{report.reporterName}</strong>: {report.reason}
                </p>
                <p className="text-xs uppercase tracking-wider text-zinc-400">
                  {report.postId ? t("admin.reportPost") : t("admin.reportUser")} ·{" "}
                  {t("admin.reportedUser")}: {report.reportedUserName ?? "—"}
                  {isSuspended(report.reportedSuspendedUntil) &&
                    ` · ${t("admin.suspended")}`}{" "}
                  · {formatDateTime(report.createdAt, locale)}
                </p>
                {report.postId && (
                  <blockquote className="whitespace-pre-wrap break-words rounded-lg border-l-2 border-yellow-500/50 bg-zinc-900/60 p-2 text-zinc-200">
                    {report.postContent ?? t("admin.postRemoved")}
                  </blockquote>
                )}
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    tone="accent"
                    onClick={() =>
                      void run(() => resolveReport({ id: report.id, status: "resolved" }))
                    }
                    icon={<Check size={14} aria-hidden="true" />}
                    label={t("admin.resolve")}
                    disabled={busy}
                  />
                  <ActionButton
                    onClick={() =>
                      void run(() =>
                        resolveReport({ id: report.id, status: "dismissed" }),
                      )
                    }
                    icon={<X size={14} aria-hidden="true" />}
                    label={t("admin.dismiss")}
                    disabled={busy}
                  />
                  {report.postId && report.postContent !== null && (
                    <ActionButton
                      tone="danger"
                      onClick={() => setPending({ kind: "deletePost", report })}
                      icon={<Trash2 size={14} aria-hidden="true" />}
                      label={t("admin.deletePost")}
                      disabled={busy}
                    />
                  )}
                  {report.reportedUserId && report.reportedUserId !== user?.id && (
                    <ActionButton
                      tone="danger"
                      onClick={() =>
                        setPending({
                          kind: isSuspended(report.reportedSuspendedUntil)
                            ? "unsuspend"
                            : "suspend",
                          userId: report.reportedUserId!,
                          name: report.reportedUserName ?? "—",
                          reportId: report.id,
                        })
                      }
                      icon={<Ban size={14} aria-hidden="true" />}
                      label={
                        isSuspended(report.reportedSuspendedUntil)
                          ? t("admin.unsuspend")
                          : t("admin.suspend")
                      }
                      disabled={busy}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
            <Users size={16} aria-hidden="true" /> {t("admin.users")} ({usersTotal})
          </h2>
          <label className="relative block sm:w-64">
            <span className="sr-only">{t("admin.searchUsers")}</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder={t("admin.searchUsers")}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black pl-9 pr-3 text-sm text-white outline-none focus:border-ritual-accent"
            />
          </label>
        </div>
        <div className="overflow-x-auto" aria-busy={usersFetching}>
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">{t("admin.users")}</caption>
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-400">
                <th scope="col" className="py-2 pr-3">
                  {t("admin.tableUser")}
                </th>
                <th scope="col" className="py-2 pr-3">
                  {t("admin.tableEssence")}
                </th>
                <th scope="col" className="py-2 pr-3">
                  {t("admin.tableRole")}
                </th>
                <th scope="col" className="py-2">
                  {t("admin.tableAction")}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => {
                const suspended = isSuspended(item.suspendedUntil);
                const self = item.id === user?.id;
                return (
                  <tr key={item.id} className="border-b border-zinc-900 last:border-0">
                    <td className="py-2 pr-3 text-zinc-200">
                      {item.username}
                      {self && (
                        <span className="ml-2 text-xs text-zinc-400">
                          {t("admin.you")}
                        </span>
                      )}
                      {suspended && (
                        <span className="ml-2 text-xs text-red-400">
                          {t("admin.suspendedUntil")}{" "}
                          {formatDateTime(item.suspendedUntil!, locale)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-ritual-accent">
                      {item.essence}
                    </td>
                    <td className="py-2 pr-3 text-zinc-400">
                      {item.isAdmin ? t("admin.roleAdmin") : t("admin.roleUser")}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton
                          tone={item.isAdmin ? "danger" : "accent"}
                          onClick={() =>
                            setPending({
                              kind: item.isAdmin ? "revoke" : "grant",
                              user: item,
                            })
                          }
                          icon={
                            item.isAdmin ? (
                              <ShieldOff size={14} aria-hidden="true" />
                            ) : (
                              <ShieldCheck size={14} aria-hidden="true" />
                            )
                          }
                          label={item.isAdmin ? t("admin.revoke") : t("admin.grant")}
                          disabled={self || busy}
                        />
                        {!item.isAdmin && (
                          <ActionButton
                            tone="danger"
                            onClick={() =>
                              setPending({
                                kind: suspended ? "unsuspend" : "suspend",
                                userId: item.id,
                                name: item.username,
                                reportId: null,
                              })
                            }
                            icon={<Ban size={14} aria-hidden="true" />}
                            label={suspended ? t("admin.unsuspend") : t("admin.suspend")}
                            disabled={busy}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <nav
          className="mt-3 flex items-center justify-end gap-2 text-xs text-zinc-400"
          aria-label={t("admin.pagination")}
        >
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            disabled={page === 0}
            aria-label={t("admin.previous")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 disabled:opacity-40"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span>
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
            disabled={page + 1 >= pageCount}
            aria-label={t("admin.next")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 disabled:opacity-40"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
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
                  {formatDateTime(entry.createdAt, locale)} · {t("admin.errorUser")}:{" "}
                  <span className="font-mono normal-case">{entry.userId ?? "—"}</span>
                </p>
                {(entry.stack || Object.keys(entry.context).length > 0) && (
                  <details className="mt-2">
                    <summary className="min-h-11 cursor-pointer text-xs text-zinc-400 hover:text-zinc-200">
                      {t("admin.details")}
                    </summary>
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-black p-2 text-xs text-zinc-400">
                      {entry.stack}
                      {Object.keys(entry.context).length > 0 &&
                        `\n${JSON.stringify(entry.context, null, 2)}`}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog ? t(dialog.title) : ""}
        description={
          dialog && (
            <>
              {t(dialog.prompt)} <strong className="text-zinc-200">{dialog.name}</strong>?
            </>
          )
        }
        confirmLabel={t(dialog?.label ?? "common.confirm")}
        destructive={pending?.kind !== "unsuspend"}
        busy={busy}
        onConfirm={confirmPending}
        onClose={() => setPending(null)}
      />
    </div>
  );
}

interface ActionDialog {
  title: TranslationKey;
  prompt: TranslationKey;
  label: TranslationKey;
  name: string;
}

function describeAction(action: PendingAction): ActionDialog {
  switch (action.kind) {
    case "grant":
      return {
        title: "admin.grantTitle",
        prompt: "admin.grantPrompt",
        label: "admin.grant",
        name: action.user.username,
      };
    case "revoke":
      return {
        title: "admin.revokeTitle",
        prompt: "admin.revokePrompt",
        label: "admin.revokeLabel",
        name: action.user.username,
      };
    case "deletePost":
      return {
        title: "admin.deletePostTitle",
        prompt: "admin.deletePostPrompt",
        label: "common.delete",
        name: action.report.reportedUserName ?? "—",
      };
    case "suspend":
      return {
        title: "admin.suspendTitle",
        prompt: "admin.suspendPrompt",
        label: "admin.suspend",
        name: action.name,
      };
    case "unsuspend":
      return {
        title: "admin.unsuspendTitle",
        prompt: "admin.unsuspendPrompt",
        label: "admin.unsuspend",
        name: action.name,
      };
  }
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled = false,
  tone = "neutral",
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "accent" | "danger";
}) {
  const tones = {
    neutral: "border-zinc-700 text-zinc-300",
    accent: "border-ritual-accent/40 text-ritual-accent",
    danger: "border-red-500/40 text-red-400",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-xs font-bold disabled:opacity-40 ${tones[tone]}`}
    >
      {icon} {label}
    </button>
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
