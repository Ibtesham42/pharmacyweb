"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** A single AdSense unit. Reserves height to avoid layout shift (CLS). */
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
    <>
      <Script
        id="adsbygoogle-init"
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}
