import { Crown } from "lucide-react";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { MembershipPlans } from "@/components/public/membership-plans";
import { listActivePlans, getMembershipByBuyer } from "@/services/memberships";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { DEFAULT_MARKETPLACE_SETTINGS } from "@/lib/marketplace/config";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "PREMIUM Membership — All-Access Pharmacy Resources",
  path: "/membership",
  description:
    "Go PREMIUM for all-access downloads of every paid and premium pharmacy resource — notes, papers, mock tests, guides and more. Simple fixed-term passes, no auto-renewal.",
});

export default async function MembershipPage() {
  const [settings, buyer, plans] = await Promise.all([
    safe(getMarketplaceSettings(), DEFAULT_MARKETPLACE_SETTINGS),
    getCurrentBuyer(),
    safe(listActivePlans(), []),
  ]);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Membership", path: "/membership" },
  ];

  if (!settings.enabled || plans.length === 0) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <Crown className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-2xl font-bold">PREMIUM Membership</h1>
        <p className="mt-2 text-muted-foreground">
          Membership plans aren’t available yet. Please check back soon for all-access PREMIUM passes.
        </p>
      </div>
    );
  }

  const membership = buyer ? await safe(getMembershipByBuyer(buyer.id), null) : null;
  const isMember = Boolean(membership && membership.expiresAt > new Date());

  return (
    <div className="container max-w-5xl py-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />

      <header className="mb-8 mt-3 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
          <Crown className="h-7 w-7 text-primary" /> Go PREMIUM
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          One pass, everything unlocked — download every paid and premium resource for the duration of your membership.
        </p>
      </header>

      <MembershipPlans
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          durationDays: p.durationDays,
          pricePaise: p.pricePaise,
          badge: p.badge,
          benefits: p.benefits,
        }))}
        razorpayAvailable={isRazorpayConfigured()}
        upiAvailable={settings.upiFallbackEnabled && Boolean(settings.upiId)}
        defaultName={buyer?.name ?? ""}
        defaultEmail={buyer?.email ?? ""}
        authed={Boolean(buyer)}
        isMember={isMember}
        memberUntil={membership ? formatDate(membership.expiresAt) : undefined}
      />
    </div>
  );
}
