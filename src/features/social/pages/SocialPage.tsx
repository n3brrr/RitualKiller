import React, { lazy, Suspense } from "react";
import Loading from "@/components/animations/Loading";

const EnhancedSocial = lazy(() => import("@/components/social/EnhancedSocial"));

const SocialPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <Suspense fallback={<Loading />}>
        <EnhancedSocial />
      </Suspense>
    </div>
  );
};

export default SocialPage;
