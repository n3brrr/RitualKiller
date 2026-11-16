import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n";

export function RouteError() {
  const { t } = useI18n();
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t("route.unknown");

  return (
    <div className="min-h-screen bg-ritual-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-950 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
        <h1 className="text-xl font-bold text-white mb-2">{t("route.title")}</h1>
        <p className="text-sm text-zinc-400 mb-6 break-words">{message}</p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center px-4 py-2 bg-ritual-accent text-black font-bold rounded-lg"
        >
          {t("route.home")}
        </Link>
      </div>
    </div>
  );
}
