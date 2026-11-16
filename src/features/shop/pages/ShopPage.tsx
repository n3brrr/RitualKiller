import { useState } from "react";
import { ShoppingBag, Zap } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useShop } from "@/hooks/useShop";
import { rarityKeys, shopItemKey, useI18n } from "@/i18n";
import { SHOP_ITEMS } from "@/data/items";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Rarity } from "@/types";

const RARITY_STYLES: Record<Rarity, string> = {
  common: "border-zinc-700 text-zinc-300",
  rare: "border-blue-500/40 text-blue-400",
  legendary: "border-yellow-500/40 text-yellow-400",
};

export default function ShopPage() {
  const { user } = useAuth();
  const { quantities, purchase, isPurchasing, error, refetch } = useShop();
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  if (!user) return null;
  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <ErrorState
          title={t("shop.errorTitle")}
          message={error.message}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const handlePurchase = async (itemId: string, name: string, cost: number) => {
    if (user.essence < cost) {
      setFeedback({ tone: "error", text: t("shop.insufficient") });
      return;
    }
    setFeedback(null);
    setSelected(itemId);
    try {
      const result = await purchase(itemId);
      if (!result.success) {
        setFeedback({
          tone: "error",
          text:
            result.reason === "insufficient_essence"
              ? t("shop.insufficient")
              : t("shop.purchaseError"),
        });
      } else {
        setFeedback({ tone: "success", text: `${t("shop.acquired")}: ${name}` });
      }
    } catch (purchaseError) {
      setFeedback({
        tone: "error",
        text: purchaseError instanceof Error ? purchaseError.message : t("shop.purchaseCatch"),
      });
    } finally {
      setSelected(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <ShoppingBag className="text-ritual-accent" aria-hidden="true" />
            {t("nav.shop")}
          </h1>
          <p className="text-sm text-zinc-400">{t("shop.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2">
          <Zap size={16} className="text-ritual-accent" aria-hidden="true" />
          <span className="font-mono text-lg text-ritual-accent">{user.essence}</span>
        </div>
      </header>

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SHOP_ITEMS.map((item) => {
          const owned = quantities[item.id] ?? 0;
          const cantAfford = user.essence < item.cost;
          const name = t(shopItemKey(item.id, "name"));

          return (
            <article
              key={item.id}
              className={`rounded-xl border bg-zinc-950 p-4 ${RARITY_STYLES[item.rarity]}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="text-3xl" aria-hidden="true">
                  {item.icon}
                </div>
                <span className="rounded border border-zinc-800 px-2 py-0.5 text-xs uppercase tracking-wider text-zinc-400">
                  {t(rarityKeys[item.rarity])}
                </span>
              </div>
              <h2 className="font-bold text-white">{name}</h2>
              <p className="mt-1 min-h-10 text-sm text-zinc-400">
                {t(shopItemKey(item.id, "description"))}
              </p>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="text-xs text-zinc-400">
                  <span className="font-mono text-ritual-accent">{item.cost}</span>{" "}
                  {t("dashboard.essenceUnit")}
                  {owned > 0 && (
                    <span className="ml-2 text-zinc-400">
                      · {t("shop.owned")} {owned}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handlePurchase(item.id, name, item.cost)}
                  disabled={cantAfford || isPurchasing || selected === item.id}
                  className="inline-flex min-h-11 items-center rounded-lg bg-ritual-accent px-4 text-sm font-bold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {selected === item.id ? t("shop.buying") : t("shop.buy")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
