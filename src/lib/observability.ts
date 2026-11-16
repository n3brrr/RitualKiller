import { supabase } from "./supabase";

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return error.stack
      ? { message: error.message, stack: error.stack }
      : { message: error.message };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: "Unknown error" };
  }
}

/** Best-effort error reporting. Never throws or blocks the UI. */
export function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  const normalized = normalizeError(error);
  console.error("[RitualKiller]", normalized.message, context);

  void supabase.auth
    .getSession()
    .then(({ data }) => {
      const userId = data.session?.user.id;
      if (!userId) return;
      return supabase.from("error_logs").insert({
        user_id: userId,
        message: normalized.message,
        stack: normalized.stack ?? null,
        context,
      });
    })
    .catch(() => undefined);
}

export function initObservability(): void {
  window.addEventListener("error", (event) => {
    captureError(event.error ?? event.message, { source: "window.error" });
  });
  window.addEventListener("unhandledrejection", (event) => {
    captureError(event.reason, { source: "unhandledrejection" });
  });
}
