import { useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useI18n } from '@/i18n'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  role?: 'dialog' | 'alertdialog'
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  role = 'dialog',
}: ModalProps) {
  const titleId = useId()
  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose)
  const { t } = useI18n()

  if (!open) return null

  return createPortal(
    // The backdrop only offers a pointer shortcut; keyboard users close with Escape
    // (useFocusTrap) or the close button, so it is presentational for AT.
    <div
      role="presentation"
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl outline-none sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="font-display text-xl font-bold text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="text-sm text-zinc-400">{children}</div>

        {footer && (
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
