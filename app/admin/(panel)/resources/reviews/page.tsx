import { ReviewStatus } from "@prisma/client";
import { listReviewsForAdmin, pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { ResourceReviewsTable } from "@/components/admin/resource-reviews-table";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResourceReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const [list, pending] = await Promise.all([
    safe(listReviewsForAdmin({ status: sp.status as ReviewStatus | undefined }), {
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
      <h1 className="text-2xl font-bold">Reviews</h1>
      <ResourceAdminTabs active="/admin/resources/reviews" pendingReviews={pending} />
      <ResourceReviewsTable reviews={list.items} />
    </div>
  );
}
