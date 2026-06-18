import Link from "next/link";
import { Receipt, Crown, ShieldCheck } from "lucide-react";
import { listAllPlans, activeMemberCount } from "@/services/memberships";
import { pendingVerificationCount } from "@/services/membership-purchases";
import { pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { MembershipPlansManager } from "@/components/admin/membership-plans-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage() {
  const [plans, members, pending, pendingVerify] = await Promise.all([
    safe(listAllPlans(), []),
    safe(activeMemberCount(), 0),
    safe(pendingReviewCount(), 0),
    safe(pendingVerificationCount(), 0),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Memberships</h1>
          <p className="text-sm text-muted-foreground">PREMIUM all-access passes (fixed-term, one-time payment).</p>
        </div>
        <Button asChild size="sm" variant={pendingVerify > 0 ? "default" : "outline"}>
          <Link href="/admin/resources/memberships/purchases">
            <ShieldCheck className="h-4 w-4" /> Verification
            {pendingVerify > 0 && (
              <Badge variant="warning" className="ml-1">
                {pendingVerify}
              </Badge>
            )}
          </Link>
        </Button>
      </div>

      <ResourceAdminTabs active="/admin/resources/memberships" pendingReviews={pending} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold">{members}</p>
              <p className="text-xs text-muted-foreground">Active (approved) members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold">{pendingVerify}</p>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <MembershipPlansManager plans={plans} />
    </div>
  );
}
