import { Languages } from "lucide-react";
import { useI18n } from "@/i18n";
import type { Locale } from "@/types";

const LABELS: Record<Locale, string> = { es: "ES", en: "EN" };
const NAMES: Record<Locale, string> = { es: "Español", en: "English" };

/**
 * ES/EN toggle for public pages (landing, login). Signed-in users change the
 * language from Settings, which also stores it in their profile.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("settings.language")}
      className={`inline-flex items-center gap-1 rounded-lg border border-zinc-800 p-1 ${className}`}
    >
      <Languages size={14} className="mx-1 text-zinc-400" aria-hidden="true" />
      {(Object.keys(LABELS) as Locale[]).map((value) => (
        <button
          key={value}
          type="button"
          lang={value}
          aria-pressed={locale === value}
          aria-label={NAMES[value]}
          onClick={() => setLocale(value)}
          className={`min-h-9 min-w-9 rounded-md px-2 text-xs font-bold ${
            locale === value
              ? "bg-ritual-accent/15 text-ritual-accent"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {LABELS[value]}
        </button>
      ))}
    </div>
  );
}
