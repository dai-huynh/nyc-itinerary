"use client";

import { Suspense } from "react";
import BuilderContent from "./BuilderContent";

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <BuilderContent />
    </Suspense>
  );
}
