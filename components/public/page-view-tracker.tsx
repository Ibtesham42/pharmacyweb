"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Sends a first-party PAGE_VIEW beacon on route change. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const body = JSON.stringify({ type: "PAGE_VIEW", path: pathname, referrer: document.referrer });
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
  }, [pathname]);

  return null;
}
