import type { ReactNode } from "react";
import "./Loading.css";

export default function Loading({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10" role="status">
      <div className="loader" aria-hidden="true">
        <div className="inner one"></div>
        <div className="inner two"></div>
        <div className="inner three"></div>
      </div>
      <span className="text-xs uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  );
}

export function PageLoading({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loading />
      {children}
    </div>
  );
}
