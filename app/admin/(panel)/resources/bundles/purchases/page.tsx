import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { listBundlePurchases } from "@/services/bundle-purchases";
import { pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { BundlePurchasesTable } from "@/components/admin/bundle-purchases-table";
import { Button } from "@/components/ui/button";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BundlePurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const [list, pending] = await Promise.all([
    safe(listBundlePurchases({ status: sp.status as OrderStatus | undefined, q: sp.q, page: Number(sp.page ?? 1) }), {
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
        <h1 className="text-2xl font-bold">Bundle purchases</h1>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/resources/bundles">
            <ArrowLeft className="h-4 w-4" /> Back to bundles
          </Link>
        </Button>
      </div>
      <ResourceAdminTabs active="/admin/resources/bundles" pendingReviews={pending} />
      <BundlePurchasesTable purchases={list.items} />
    </div>
  );
}
