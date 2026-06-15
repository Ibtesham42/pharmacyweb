"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * A single AdSense unit. The loader script is included site-wide in the public
 * layout, so here we only render the <ins> and queue a render. Reserves height
 * to avoid layout shift (CLS).
 */
export function AdSenseUnit({ slotId }: { slotId: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT as string;
  const pushed = useRef(false);

  useEffect(() => {
    try {
      if (!pushed.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", minHeight: 90 }}
      data-ad-client={client}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
