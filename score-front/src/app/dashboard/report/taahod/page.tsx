import React, { Suspense } from "react";
import { SkeletonLoader } from "./_components/SkeletonLoader";
import { TaahodContent } from "./_components/TaahodContent";

export default function TaahodReportPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={<SkeletonLoader />}>
        <TaahodContent />
      </Suspense>
    </div>
  );
}
