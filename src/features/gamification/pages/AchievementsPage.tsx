/**
 * AchievementsPage.tsx
 *
 * Página principal de logros (Sala de Trofeos).
 * Renderiza la lista de logros obtenidos usando carga diferida (lazy loading)
 * y muestra un indicador de carga mientras el módulo se obtiene.
 */

import React, { lazy, Suspense } from "react";
import Loading from "@/components/animations/Loading";

// Carga diferida del componente de la lista de logros.
const AchievementsList = lazy(
  () => import("@/components/achievements/AchievementsList"),
);

const AchievementsPage = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-display font-bold text-white mb-1">
          Sala de Trofeos
        </h2>
        <p className="text-zinc-500">
          Tus hazañas inmortales en el camino a la ascensión.
        </p>
      </header>
      {/* Renderiza la lista de logros con indicador de carga mientras se obtiene el componente */}
      <Suspense fallback={<Loading />}>
        <AchievementsList />
      </Suspense>
    </div>
  );
};

export default AchievementsPage;
