import { createContext, useContext } from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastOptions {
  tone?: ToastTone;
  /** Milliseconds before the toast closes on its own (errors stay longer). */
  duration?: number;
}

export interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** Global, non-blocking feedback for quick actions (complete, like, mark read...). */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
