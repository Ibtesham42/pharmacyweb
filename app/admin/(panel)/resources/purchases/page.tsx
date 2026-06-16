import { Wallet, ShoppingCart, TrendingUp, Download } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { listPurchases, marketplaceAnalytics } from "@/services/resource-purchases";
import { pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { ResourcePurchasesTable } from "@/components/admin/resource-purchases-table";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResourcePurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const [list, stats, pending] = await Promise.all([
    safe(listPurchases({ status: sp.status as OrderStatus | undefined, q: sp.q, page: Number(sp.page ?? 1) }), {
      items: [],
      total: 0,
      page: 1,
      perPage: 25,
      pages: 1,
    }),
    safe(marketplaceAnalytics(), {
      totalRevenuePaise: 0,
      monthRevenuePaise: 0,
      paidCount: 0,
      totalCount: 0,
      conversion: 0,
      topPurchased: [] as { title: string; slug: string; revenue: number; count: number }[],
      mostDownloaded: [] as { id: string; title: string; slug: string; downloadCount: number }[],
      revenueByCategory: [] as { name: string; total: number }[],
    }),
    safe(pendingReviewCount(), 0),
  ]);

  const cards = [
    { icon: Wallet, label: "Total revenue", value: formatINR(stats.totalRevenuePaise) },
    { icon: TrendingUp, label: "This month", value: formatINR(stats.monthRevenuePaise) },
    { icon: ShoppingCart, label: "Paid · conversion", value: `${stats.paidCount} · ${stats.conversion}%` },
    { icon: Download, label: "Orders", value: String(stats.totalCount) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Purchases</h1>
      <ResourceAdminTabs active="/admin/resources/purchases" pendingReviews={pending} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ResourcePurchasesTable purchases={list.items} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Most purchased</h3>
            {stats.topPurchased.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              stats.topPurchased.map((t, i) => (
                <div key={i} className="flex justify-between py-0.5 text-sm">
                  <span className="truncate">{t.title}</span>
                  <span className="font-medium">{formatINR(t.revenue)} ({t.count})</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Most downloaded</h3>
            {stats.mostDownloaded.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              stats.mostDownloaded.map((t) => (
                <div key={t.id} className="flex justify-between py-0.5 text-sm">
                  <span className="truncate">{t.title}</span>
                  <span className="font-medium">{t.downloadCount}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Revenue by category</h3>
            {stats.revenueByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              stats.revenueByCategory.map((t, i) => (
                <div key={i} className="flex justify-between py-0.5 text-sm">
                  <span className="truncate">{t.name}</span>
                  <span className="font-medium">{formatINR(t.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
