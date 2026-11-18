import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useNotifications } from '@/hooks/useNotifications'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useI18n } from '@/i18n'
import { errorMessage } from '@/lib/errors'
import { useToast } from '@/hooks/useToast'
import { notificationText } from '@/utils/notificationText'
import { formatDateTime } from '@/utils/dates'

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications()
  const { t, tn, locale } = useI18n()
  const toast = useToast()
  // Quick actions report failures instead of failing silently.
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action()
    } catch (actionError) {
      toast.error(errorMessage(actionError, t))
    }
  }
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const panelRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false), {
    modal: false,
  })
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={tn('notifications.bellLabel', unreadCount)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ritual-accent px-1 text-xs font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t('notifications.title')}
          tabIndex={-1}
          className="absolute right-0 z-[70] mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl outline-none"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <h2 className="font-display font-bold text-white">
              {t('notifications.title')}
            </h2>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void run(() => markAllRead())}
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs text-zinc-400 hover:text-ritual-accent"
                >
                  <CheckCheck size={14} /> {t('notifications.read')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('notifications.close')}
                data-autofocus
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-400">
                {t('notifications.empty')}
              </p>
            )}
            {notifications.slice(0, 8).map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  if (!notification.read)
                    void run(() => markRead(notification.id))
                  setOpen(false)
                  navigate('/app/notifications')
                }}
                className={`block w-full border-b border-zinc-900 p-4 text-left last:border-0 hover:bg-zinc-900/60 ${
                  notification.read ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-white">
                    {notificationText(notification, t).title}
                  </span>
                  {!notification.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ritual-accent" />
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {notificationText(notification, t).message}
                </p>
                <span className="mt-1 block text-xs text-zinc-400">
                  {formatDateTime(notification.createdAt, locale)}
                </span>
              </button>
            ))}
          </div>

          <Link
            to="/app/notifications"
            onClick={() => setOpen(false)}
            className="block min-h-11 border-t border-zinc-800 p-3 text-center text-sm font-bold text-ritual-accent"
          >
            {t('notifications.viewAll')}
          </Link>
        </div>
      )}
    </div>
  )
}
