import React, { lazy, Suspense } from "react";
import Loading from "@/components/animations/Loading";

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

      <Suspense fallback={<Loading />}>
        <AdvancedAnalytics />
      </Suspense>
    </div>
  );
};

export default AnalyticsPage;
