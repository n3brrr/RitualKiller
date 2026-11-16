import React, { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import Loading from "@/components/animations/Loading";

const EnhancedSocial = lazyWithRetry(() => import("@/components/social/EnhancedSocial"));

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
