"use client";

import { useEffect } from "react";

function track(id: string, action: "impression" | "click") {
  const body = JSON.stringify({ id, action });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/ads/track", new Blob([body], { type: "application/json" }));
  } else {
    void fetch("/api/ads/track", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    });
  }
}

/** Self-hosted banner ad image with impression/click tracking. */
export function AdBanner({
  id,
  imageUrl,
  targetUrl,
  name,
}: {
  id: string;
  imageUrl: string;
  targetUrl?: string | null;
  name: string;
}) {
  useEffect(() => {
    track(id, "impression");
  }, [id]);

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={name} className="mx-auto h-auto w-full rounded-lg" loading="lazy" />
  );

  if (!targetUrl) return img;
  return (
    <a href={targetUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={() => track(id, "click")}>
      {img}
    </a>
  );
}
