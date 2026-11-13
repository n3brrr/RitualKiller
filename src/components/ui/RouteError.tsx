import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Error desconocido";

  return (
    <div className="min-h-screen bg-ritual-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-950 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
        <h1 className="text-xl font-bold text-white mb-2">Ruta no disponible</h1>
        <p className="text-sm text-zinc-400 mb-6 break-words">{message}</p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center px-4 py-2 bg-ritual-accent text-black font-bold rounded-lg"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
