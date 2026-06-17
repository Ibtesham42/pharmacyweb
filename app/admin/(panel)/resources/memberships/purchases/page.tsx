import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { listMembershipPurchases } from "@/services/membership-purchases";
import { pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { MembershipPurchasesTable } from "@/components/admin/membership-purchases-table";
import { Button } from "@/components/ui/button";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MembershipPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const [list, pending] = await Promise.all([
    safe(listMembershipPurchases({ status: sp.status as OrderStatus | undefined, q: sp.q, page: Number(sp.page ?? 1) }), {
      items: [],
      total: 0,
      page: 1,
      perPage: 25,
      pages: 1,
    }),
    safe(pendingReviewCount(), 0),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Membership purchases</h1>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/resources/memberships">
            <ArrowLeft className="h-4 w-4" /> Back to memberships
          </Link>
        </Button>
      </div>
      <ResourceAdminTabs active="/admin/resources/memberships" pendingReviews={pending} />
      <MembershipPurchasesTable purchases={list.items} />
    </div>
  );
}
