import { lazy, type ComponentType } from "react";

const RELOAD_FLAG = "rk_chunk_reload";

/** True for the errors browsers raise when a lazy chunk no longer exists. */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    message,
  );
}

function reloadOnce(): boolean {
  try {
    if (window.sessionStorage.getItem(RELOAD_FLAG)) return false;
    window.sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** Clears the guard once a page has loaded fine. */
export function markChunksHealthy(): void {
  try {
    window.sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // Ignore: storage unavailable.
  }
}

/**
 * React.lazy that survives deployments: after a new release the old hashed
 * chunks return 404, so the import is retried once and, if it still fails,
 * the page reloads (once) to pick up the new index.html and chunk names.
 */
export function lazyWithRetry<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      if (!isChunkLoadError(firstError)) throw firstError;
      try {
        return await factory();
      } catch (secondError) {
        if (reloadOnce()) {
          // Keep Suspense waiting while the browser reloads.
          return new Promise<{ default: ComponentType<P> }>(() => undefined);
        }
        throw secondError;
      }
    }
  });
}
