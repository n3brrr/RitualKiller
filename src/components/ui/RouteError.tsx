import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n";
import { isChunkLoadError } from "@/lib/lazyWithRetry";

/**
 * Router-level error screen. Technical messages are not shown to users (they
 * are logged by observability); an outdated deployment offers a reload.
 */
export function RouteError() {
  const { t } = useI18n();
  const error = useRouteError();
  const outdated = isChunkLoadError(error);
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : outdated
      ? t("route.newVersion")
      : t("route.unknown");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ritual-black p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-zinc-950 p-6 text-center">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={32} aria-hidden="true" />
        <h1 className="mb-2 text-xl font-bold text-white">{t("route.title")}</h1>
        <p className="mb-6 break-words text-sm text-zinc-400">{message}</p>
        {outdated ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ritual-accent px-4 py-2 font-bold text-black"
          >
            <RefreshCw size={16} aria-hidden="true" /> {t("error.reload")}
          </button>
        ) : (
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ritual-accent px-4 py-2 font-bold text-black"
          >
            {t("route.home")}
          </Link>
        )}
      </div>
    </div>
  );
}
