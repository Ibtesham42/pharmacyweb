import Link from "next/link";
import { Receipt, Crown } from "lucide-react";
import { listAllPlans, activeMemberCount } from "@/services/memberships";
import { pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { MembershipPlansManager } from "@/components/admin/membership-plans-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage() {
  const [plans, members, pending] = await Promise.all([
    safe(listAllPlans(), []),
    safe(activeMemberCount(), 0),
    safe(pendingReviewCount(), 0),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Memberships</h1>
          <p className="text-sm text-muted-foreground">PREMIUM all-access passes (fixed-term, one-time payment).</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/resources/memberships/purchases">
            <Receipt className="h-4 w-4" /> Purchases
          </Link>
        </Button>
      </div>

      <ResourceAdminTabs active="/admin/resources/memberships" pendingReviews={pending} />

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
            <Crown className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold">{members}</p>
            <p className="text-xs text-muted-foreground">Active members</p>
          </div>
        </CardContent>
      </Card>

      <MembershipPlansManager plans={plans} />
    </div>
  );
}
