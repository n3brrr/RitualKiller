/**
 * AnalyticsPage.tsx
 *
 * Página principal para mostrar análisis avanzados.
 * Renderiza el componente de analíticas avanzadas bajo carga diferida (lazy loading),
 * mostrando un indicador mientras se obtiene el módulo.
 */

import React, { lazy, Suspense } from "react";
import Loading from "@/components/animations/Loading";

// Carga diferida del componente avanzado de analíticas
const AdvancedAnalytics = lazy(
  () => import("@/components/analytics/AdvancedAnalytics"),
);

const AnalyticsPage = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-display font-bold text-white mb-1">
          Analíticas Avanzadas
        </h2>
        <p className="text-zinc-500">
          Profundiza en tus datos y optimiza tu rendimiento.
        </p>
      </header>

      {/* Renderiza el componente avanzado con fallback de carga */}
      <Suspense fallback={<Loading />}>
        <AdvancedAnalytics />
      </Suspense>
    </div>
  );
};

export default AnalyticsPage;
