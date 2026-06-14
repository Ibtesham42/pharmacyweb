"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/** External apply link that records an outbound-click analytics event (beacon). */
export function ApplyButton({ url, postId }: { url: string; postId: string }) {
  function track() {
    const body = JSON.stringify({ type: "OUTBOUND_CLICK", postId, path: url });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/analytics", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    }
  }

  return (
    <Button asChild size="lg" className="w-full sm:w-auto" onClick={track}>
      <a href={url} target="_blank" rel="noopener noreferrer nofollow">
        Apply Now <ExternalLink className="h-4 w-4" />
      </a>
    </Button>
  );
}
