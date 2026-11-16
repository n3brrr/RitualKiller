/**
 * AnalyticsPage.tsx
 *
 * Página principal para mostrar análisis avanzados.
 * Renderiza el componente de analíticas avanzadas bajo carga diferida (lazy loading),
 * mostrando un indicador mientras se obtiene el módulo.
 */

import React, { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import Loading from "@/components/animations/Loading";
import { useI18n } from "@/i18n";

// Carga diferida del componente avanzado de analíticas
const AdvancedAnalytics = lazyWithRetry(
  () => import("@/components/analytics/AdvancedAnalytics"),
);

const AnalyticsPage = () => {
  const { t } = useI18n();
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="mb-1 font-display text-2xl font-bold text-white sm:text-3xl">
          {t("analytics.title")}
        </h1>
        <p className="text-sm text-zinc-400">{t("analytics.subtitle")}</p>
      </header>

      {/* Renderiza el componente avanzado con fallback de carga */}
      <Suspense fallback={<Loading />}>
        <AdvancedAnalytics />
      </Suspense>
    </div>
  );
};

export default AnalyticsPage;
