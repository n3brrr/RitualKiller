import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useI18n } from "@/i18n";
import { formatDateTime } from "@/utils/dates";
import Loading from "@/components/animations/Loading";

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAllRead, markRead, removeNotification } =
    useNotifications();
  const { t } = useI18n();

  if (isLoading) return <Loading />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("notifications.title")}</h1>
          <p className="text-sm text-zinc-500">
            {unreadCount} {t("notifications.unread")}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-300 hover:border-ritual-accent hover:text-ritual-accent"
          >
            <CheckCheck size={16} aria-hidden="true" />
            {t("notifications.markAll")}
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
          {t("notifications.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`rounded-xl border p-4 ${
                notification.read
                  ? "border-zinc-900 bg-zinc-950 opacity-70"
                  : "border-ritual-accent/30 bg-ritual-accent/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-ritual-accent" aria-hidden="true" />
                    )}
                    <h2 className="font-bold text-white">{notification.title}</h2>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{notification.message}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => void markRead(notification.id)}
                      aria-label="Marcar como leída"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 hover:text-ritual-accent"
                    >
                      <Bell size={16} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void removeNotification(notification.id)}
                    aria-label="Eliminar notificación"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 hover:text-red-500"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
