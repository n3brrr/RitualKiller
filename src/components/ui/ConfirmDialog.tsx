import type { ReactNode } from 'react'
import { useI18n } from '@/i18n'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useI18n()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      role="alertdialog"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            data-autofocus={destructive ? true : undefined}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-bold text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
          >
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            data-autofocus={destructive ? undefined : true}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold text-black disabled:opacity-50 ${
              destructive
                ? 'bg-red-500 text-white hover:bg-red-400'
                : 'bg-ritual-accent hover:bg-emerald-400'
            }`}
          >
            {busy
              ? t('common.processing')
              : (confirmLabel ?? t('common.confirm'))}
          </button>
        </>
      }
    >
      {description}
    </Modal>
  )
}
