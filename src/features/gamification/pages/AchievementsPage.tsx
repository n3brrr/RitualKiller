import React, { lazy, Suspense } from "react";
import Loading from "@/components/animations/Loading";

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

      <Suspense fallback={<Loading />}>
        <AchievementsList />
      </Suspense>
    </div>
  );
};

export default AchievementsPage;
