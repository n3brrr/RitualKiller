import type { ReactNode } from "react";
import "./Loading.css";

export default function Loading({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10" role="status">
      <svg className="rk-loader h-10 w-10" viewBox="0 0 40 40" aria-hidden="true">
        <circle className="rk-loader-track" cx="20" cy="20" r="17" />
        <circle className="rk-loader-arc" cx="20" cy="20" r="17" />
      </svg>
      <span className="font-display text-xs uppercase tracking-[0.3em] text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export function PageLoading({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loading />
      {children}
    </div>
  );
}
