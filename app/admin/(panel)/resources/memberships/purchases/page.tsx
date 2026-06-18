import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MembershipStatus } from "@prisma/client";
import { listMembershipPurchases, pendingVerificationCount } from "@/services/membership-purchases";
import { pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { MembershipPurchasesTable } from "@/components/admin/membership-purchases-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "SUSPENDED", label: "Suspended" },
];
const VALID = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "EXPIRED"];

export default async function MembershipPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ verification?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const verification = (VALID.includes(sp.verification ?? "") ? sp.verification : undefined) as
    | MembershipStatus
    | undefined;
  const [list, pendingReviews, pendingVerify] = await Promise.all([
    safe(listMembershipPurchases({ membershipStatus: verification, q: sp.q, page: Number(sp.page ?? 1) }), {
      items: [],
      total: 0,
      page: 1,
      perPage: 25,
      pages: 1,
    }),
    safe(pendingReviewCount(), 0),
    safe(pendingVerificationCount(), 0),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Membership Verification</h1>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/resources/memberships">
            <ArrowLeft className="h-4 w-4" /> Back to memberships
          </Link>
        </Button>
      </div>
      <ResourceAdminTabs active="/admin/resources/memberships" pendingReviews={pendingReviews} />
      <p className="text-sm text-muted-foreground">
        {pendingVerify > 0 ? (
          <>
            <Badge variant="warning">{pendingVerify}</Badge> paid membership(s) awaiting approval.{" "}
          </>
        ) : (
          "No paid memberships awaiting approval. "
        )}
        Approve to activate PREMIUM, or reject/suspend. PREMIUM never activates on payment alone.
      </p>
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const isActive = (verification ?? "") === f.key;
          return (
            <Button key={f.key} asChild size="sm" variant={isActive ? "default" : "outline"}>
              <Link
                href={
                  f.key
                    ? `/admin/resources/memberships/purchases?verification=${f.key}`
                    : "/admin/resources/memberships/purchases"
                }
              >
                {f.label}
              </Link>
            </Button>
          );
        })}
      </div>
      <MembershipPurchasesTable purchases={list.items} />
    </div>
  );
}
