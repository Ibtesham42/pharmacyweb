import type { AdSlot as AdSlotEnum } from "@prisma/client";
import { getAdForSlot } from "@/services/ads";
import { cn } from "@/lib/utils";
import { AdSenseUnit } from "./adsense";
import { AdBanner } from "./ad-banner";

const ADSENSE_ENABLED = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

/**
 * Renders the active ad configured for a slot. Returns null when nothing is
 * configured/enabled so layouts stay clean. Server component (reads ad config).
 */
export async function AdSlot({ slot, className }: { slot: AdSlotEnum; className?: string }) {
  const ad = await getAdForSlot(slot).catch(() => null);
  if (!ad) return null;

  const wrap = (children: React.ReactNode) => (
    <div className={cn("my-6 flex justify-center", className)} aria-label="Advertisement">
      {children}
    </div>
  );

  if (ad.type === "ADSENSE") {
    if (!ADSENSE_ENABLED || !ADSENSE_CLIENT || !ad.adsenseSlotId) return null;
    return wrap(<AdSenseUnit slotId={ad.adsenseSlotId} />);
  }

  if (ad.type === "BANNER_IMAGE" && ad.imageUrl) {
    return wrap(
      <AdBanner id={ad.id} imageUrl={ad.imageUrl} targetUrl={ad.targetUrl} name={ad.name} />,
    );
  }

  // HTML snippet is admin-authored (trusted) — rendered as-is.
  if (ad.type === "HTML" && ad.htmlSnippet) {
    return wrap(<div dangerouslySetInnerHTML={{ __html: ad.htmlSnippet }} />);
  }

  return null;
}
