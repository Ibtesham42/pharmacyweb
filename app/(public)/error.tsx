"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/public/error-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container py-16">
      <ErrorState
        title="Something went wrong"
        description="We couldn't load this page. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
