"use client";

import { useEffect, useRef } from "react";

/**
 * Records a POST_VIEW for a post via a beacon (once per mount). Moving the
 * view-count write off the server render lets detail pages be ISR-cached.
 */
export function ViewBeacon({ postId }: { postId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const body = JSON.stringify({ type: "POST_VIEW", postId });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  }, [postId]);

  return null;
}
