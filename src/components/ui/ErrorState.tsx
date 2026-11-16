import { AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center"
    >
      <AlertCircle className="mx-auto mb-2 text-red-500" size={24} aria-hidden="true" />
      <h2 className="font-display text-lg font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-red-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 transition-colors hover:border-ritual-accent hover:text-ritual-accent"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
