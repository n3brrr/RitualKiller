import { useState } from "react";
import { Package, Zap } from "lucide-react";
import { useShop } from "@/hooks/useShop";
import { useI18n } from "@/i18n";
import { SHOP_ITEMS } from "@/data/items";
import { formatDateTime } from "@/utils/dates";
import Loading from "@/components/animations/Loading";

export default function InventoryPage() {
  const { quantities, buffs, isLoading, consume, error } = useShop();
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (isLoading) return <Loading />;

  const handleConsume = async (itemId: string, name: string) => {
    setPendingId(itemId);
    setFeedback(null);
    try {
      const result = await consume(itemId);
      if (!result.success) {
        setFeedback({
          tone: "error",
          text:
            result.reason === "not_owned"
              ? "Ya no tienes ese artefacto."
              : "No se pudo usar el artefacto.",
        });
      } else {
        setFeedback({ tone: "success", text: `${name} usado.` });
      }
    } catch (consumeError) {
      setFeedback({
        tone: "error",
        text: consumeError instanceof Error ? consumeError.message : "No se pudo usar el artefacto.",
      });
    } finally {
      setPendingId(null);
    }
  };

  const owned = SHOP_ITEMS.filter((item) => (quantities[item.id] ?? 0) > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
          <Package className="text-ritual-accent" aria-hidden="true" />
          {t("nav.inventory")}
        </h1>
        <p className="text-sm text-zinc-500">Tus artefactos y ventajas activas.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error.message}
        </p>
      )}

      {feedback && (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`rounded-lg border p-3 text-sm ${
            feedback.tone === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-ritual-accent/30 bg-ritual-accent/10 text-ritual-accent"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {buffs.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Ventajas activas
          </h2>
          <ul className="space-y-2">
            {buffs.map((buff) => {
              const item = SHOP_ITEMS.find((shopItem) => shopItem.id === buff.itemId);
              return (
                <li
                  key={buff.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-ritual-accent/30 bg-ritual-accent/5 p-3"
                >
                  <span className="text-sm text-zinc-200">{item?.name ?? buff.itemId}</span>
                  <span className="text-xs text-ritual-accent">
                    x{buff.multiplier} · hasta {formatDateTime(buff.expiresAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {owned.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
          Tu inventario está vacío. Visita el mercado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {owned.map((item) => (
            <article key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl" aria-hidden="true">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-white">{item.name}</h2>
                  <p className="text-xs text-zinc-500">{item.description}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Cantidad: <strong className="text-ritual-accent">{quantities[item.id]}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleConsume(item.id, item.name)}
                disabled={pendingId === item.id}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-bold text-zinc-200 hover:border-ritual-accent hover:text-ritual-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Zap size={16} aria-hidden="true" /> {pendingId === item.id ? "Usando..." : "Usar"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
