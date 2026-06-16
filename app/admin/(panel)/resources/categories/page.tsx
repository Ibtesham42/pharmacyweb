import { listResourceCategories } from "@/services/resource-categories";
import { pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { ResourceCategoriesManager } from "@/components/admin/resource-categories-manager";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResourceCategoriesPage() {
  const [categories, pending] = await Promise.all([
    safe(listResourceCategories(), []),
    safe(pendingReviewCount(), 0),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Resource categories</h1>
      <ResourceAdminTabs active="/admin/resources/categories" pendingReviews={pending} />
      <ResourceCategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          sortOrder: c.sortOrder,
          _count: c._count,
        }))}
      />
    </div>
  );
}
