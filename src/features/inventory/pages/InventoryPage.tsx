import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, Zap } from 'lucide-react'
import { useShop } from '@/hooks/useShop'
import { shopItemKey, useI18n } from '@/i18n'
import { errorMessage } from '@/lib/errors'
import { shopItemIcon } from '@/data/items'
import { formatDateTime } from '@/utils/dates'
import Loading from '@/components/animations/Loading'
import { ErrorState } from '@/components/ui/ErrorState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function InventoryPage() {
  const { items, quantities, buffs, isLoading, consume, error, refetch } =
    useShop()
  const { t, locale } = useI18n()
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error'
    text: string
  } | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirmUse, setConfirmUse] = useState<{
    id: string
    name: string
  } | null>(null)

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title={t('inventory.errorTitle')}
          message={errorMessage(error, t)}
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  const handleConsume = async (itemId: string, name: string) => {
    setPendingId(itemId)
    setFeedback(null)
    try {
      const result = await consume(itemId)
      if (!result.success) {
        setFeedback({
          tone: 'error',
          text:
            result.reason === 'not_owned'
              ? t('inventory.notOwned')
              : result.reason === 'nothing_to_restore'
                ? t('inventory.nothingToRestore')
                : result.reason === 'passive_item'
                  ? t('inventory.passive')
                  : t('inventory.useError'),
        })
      } else {
        setFeedback({
          tone: 'success',
          text: result.restored
            ? t('inventory.usedWithRestored', { name, count: result.restored })
            : t('inventory.usedItem', { name }),
        })
      }
    } catch (consumeError) {
      setFeedback({
        tone: 'error',
        text: errorMessage(consumeError, t),
      })
    } finally {
      setPendingId(null)
    }
  }

  const owned = items.filter((item) => (quantities[item.id] ?? 0) > 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
          <Package className="text-ritual-accent" aria-hidden="true" />
          {t('nav.inventory')}
        </h1>
        <p className="text-sm text-zinc-400">{t('inventory.subtitle')}</p>
      </header>

      {feedback && (
        <p
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border p-3 text-sm ${
            feedback.tone === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-ritual-accent/30 bg-ritual-accent/10 text-ritual-accent'
          }`}
        >
          {feedback.text}
        </p>
      )}

      {buffs.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
            {t('inventory.buffs')}
          </h2>
          <ul className="space-y-2">
            {buffs.map((buff) => {
              const item = items.find((shopItem) => shopItem.id === buff.itemId)
              return (
                <li
                  key={buff.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-ritual-accent/30 bg-ritual-accent/5 p-3"
                >
                  <span className="text-sm text-zinc-200">
                    {item ? t(shopItemKey(item.id, 'name')) : buff.itemId}
                  </span>
                  <span className="text-xs text-ritual-accent">
                    {t('inventory.buffUntil', {
                      multiplier: buff.multiplier,
                      date: formatDateTime(buff.expiresAt, locale),
                    })}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {owned.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-400">
          <Package
            className="mx-auto mb-3 text-ritual-accent/60"
            size={28}
            aria-hidden="true"
          />
          <p>{t('inventory.empty')}</p>
          <Link
            to="/app/shop"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-ritual-accent px-4 text-sm font-bold text-black transition-colors hover:bg-emerald-400"
          >
            <ShoppingBag size={16} aria-hidden="true" />{' '}
            {t('inventory.visitMarket')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {owned.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl" aria-hidden="true">
                  {shopItemIcon(item.id)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-white">
                    {t(shopItemKey(item.id, 'name'))}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {t(shopItemKey(item.id, 'description'))}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {t('inventory.quantity')}:{' '}
                    <strong className="text-ritual-accent">
                      {quantities[item.id]}
                    </strong>
                  </p>
                </div>
              </div>
              {item.consumable ? (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmUse({
                      id: item.id,
                      name: t(shopItemKey(item.id, 'name')),
                    })
                  }
                  disabled={pendingId === item.id}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-bold text-zinc-200 hover:border-ritual-accent hover:text-ritual-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Zap size={16} aria-hidden="true" />{' '}
                  {pendingId === item.id
                    ? t('inventory.using')
                    : t('inventory.use')}
                </button>
              ) : (
                <p className="mt-3 rounded-lg border border-ritual-accent/30 bg-ritual-accent/5 p-2 text-center text-xs font-bold uppercase tracking-wider text-ritual-accent">
                  {t('inventory.passive')}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(confirmUse)}
        title={t('inventory.confirmTitle')}
        description={
          confirmUse
            ? t('inventory.confirmPrompt', { name: confirmUse.name })
            : ''
        }
        confirmLabel={t('inventory.use')}
        busy={Boolean(pendingId)}
        onConfirm={() => {
          if (!confirmUse) return
          const item = confirmUse
          setConfirmUse(null)
          void handleConsume(item.id, item.name)
        }}
        onClose={() => setConfirmUse(null)}
      />
    </div>
  )
}
