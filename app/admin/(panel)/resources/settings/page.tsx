import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { pendingReviewCount } from "@/services/resource-reviews";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { MarketplaceSettingsForm } from "@/components/admin/marketplace-settings-form";
import { DEFAULT_MARKETPLACE_SETTINGS } from "@/lib/marketplace/config";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MarketplaceSettingsPage() {
  const [settings, pending] = await Promise.all([
    safe(getMarketplaceSettings(), DEFAULT_MARKETPLACE_SETTINGS),
    safe(pendingReviewCount(), 0),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Store settings</h1>
      <ResourceAdminTabs active="/admin/resources/settings" pendingReviews={pending} />
      <MarketplaceSettingsForm settings={settings} razorpayConfigured={isRazorpayConfigured()} />
    </div>
  );
}
