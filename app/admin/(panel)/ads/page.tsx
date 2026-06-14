import { listAds } from "@/services/ads";
import { AdManager } from "@/components/admin/ad-manager";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const ads = await listAds();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Advertisements</h1>
        <p className="text-muted-foreground">
          Configure ad slots. Set your AdSense client id and{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_ADSENSE_ENABLED=true</code> in env, then
          activate slots here.
        </p>
      </div>
      <AdManager
        ads={ads.map((a) => ({
          id: a.id,
          name: a.name,
          slot: a.slot,
          type: a.type,
          adsenseSlotId: a.adsenseSlotId,
          imageUrl: a.imageUrl,
          targetUrl: a.targetUrl,
          isActive: a.isActive,
          impressions: a.impressions,
          clicks: a.clicks,
        }))}
      />
    </div>
  );
}
