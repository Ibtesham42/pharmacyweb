import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { listAdminBundles } from "@/services/bundles";
import { pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { BundleRowActions } from "@/components/admin/bundle-row-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/format";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBundlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const [result, pending] = await Promise.all([
    safe(listAdminBundles({ status: sp.status, q: sp.q, page: Number(sp.page ?? 1) }), {
      items: [],
      total: 0,
      page: 1,
      perPage: 20,
      pages: 1,
    }),
    safe(pendingReviewCount(), 0),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Bundles</h1>
          <p className="text-sm text-muted-foreground">Exam-prep packs — sell multiple resources together.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/resources/bundles/purchases">
              <Receipt className="h-4 w-4" /> Purchases
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/resources/bundles/new">
              <Plus className="h-4 w-4" /> New bundle
            </Link>
          </Button>
        </div>
      </div>

      <ResourceAdminTabs active="/admin/resources/bundles" pendingReviews={pending} />

      <Card className="overflow-hidden">
        {result.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No bundles yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Sales</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/resources/bundles/${b.id}`} className="font-medium hover:underline">
                        {b.title}
                      </Link>
                      {b.examType && <span className="ml-2 text-xs text-muted-foreground">{b.examType}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{b._count.items}</td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{formatINR(b.pricePaise)}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{b._count.purchases}</td>
                    <td className="px-4 py-3">
                      <Badge variant={b.status === "PUBLISHED" ? "success" : "secondary"}>{b.status}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                      {formatDate(b.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <BundleRowActions id={b.id} status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
