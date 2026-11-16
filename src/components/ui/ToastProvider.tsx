import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useI18n } from "@/i18n";
import {
  ToastContext,
  type ToastContextValue,
  type ToastOptions,
  type ToastTone,
} from "@/hooks/useToast";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const MAX_TOASTS = 3;
const ICONS = {
  success: <CheckCircle2 size={18} aria-hidden="true" />,
  error: <AlertCircle size={18} aria-hidden="true" />,
  info: <Info size={18} aria-hidden="true" />,
} as const;
const TONES = {
  success: "border-ritual-accent/40 text-ritual-accent",
  error: "border-red-500/40 text-red-300",
  info: "border-zinc-700 text-zinc-200",
} as const;

/**
 * Renders toasts in two live regions (polite for success/info, assertive for
 * errors) so screen readers announce them without moving focus.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const tone = options.tone ?? "info";
      const id = (nextId.current += 1);
      setToasts((current) => [...current, { id, message, tone }].slice(-MAX_TOASTS));
      const duration = options.duration ?? (tone === "error" ? 7000 : 4000);
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message) => show(message, { tone: "success" }),
      error: (message) => show(message, { tone: "error" }),
    }),
    [show],
  );

  const renderGroup = (assertive: boolean) => (
    <div
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      className="flex flex-col gap-2"
    >
      {toasts
        .filter((toast) => (toast.tone === "error") === assertive)
        .map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-zinc-950/95 p-3 text-sm shadow-2xl backdrop-blur ${TONES[toast.tone]}`}
          >
            <span className="mt-0.5 shrink-0">{ICONS[toast.tone]}</span>
            <p className="flex-1 text-zinc-100">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={t("common.close")}
              className="-m-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:text-white"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[95] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96">
        {renderGroup(true)}
        {renderGroup(false)}
      </div>
    </ToastContext.Provider>
  );
}
