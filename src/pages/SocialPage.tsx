import React, { lazy, Suspense } from "react";

const EnhancedSocial = lazy(() => import("../components/social/EnhancedSocial"));

const SocialPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <Suspense fallback={
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          Cargando comunidad...
        </div>
      }>
        <EnhancedSocial />
      </Suspense>
    </div>
  );
};

export default SocialPage;
