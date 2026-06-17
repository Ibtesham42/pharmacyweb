import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/format";

type BarRow = { label: string; value: number; display: string; href?: string };

function Bars({ rows }: { rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            {r.href ? (
              <Link href={r.href} className="truncate hover:underline">
                {r.label}
              </Link>
            ) : (
              <span className="truncate">{r.label}</span>
            )}
            <span className="shrink-0 font-medium tabular-nums">{r.display}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(3, Math.round((r.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, rows }: { title: string; rows: BarRow[] }) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">{title}</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <Bars rows={rows} />
        )}
      </CardContent>
    </Card>
  );
}

export function MarketplaceAnalytics({
  topPurchased,
  mostDownloaded,
  revenueByCategory,
}: {
  topPurchased: { title: string; slug: string; revenue: number; count: number }[];
  mostDownloaded: { id: string; title: string; slug: string; downloadCount: number }[];
  revenueByCategory: { name: string; total: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Most purchased (revenue)"
        rows={topPurchased.map((t) => ({
          label: t.title,
          value: t.revenue,
          display: `${formatINR(t.revenue)} · ${t.count}`,
          href: t.slug ? `/store/${t.slug}` : undefined,
        }))}
      />
      <ChartCard
        title="Most downloaded"
        rows={mostDownloaded.map((t) => ({
          label: t.title,
          value: t.downloadCount,
          display: String(t.downloadCount),
          href: t.slug ? `/store/${t.slug}` : undefined,
        }))}
      />
      <ChartCard
        title="Revenue by category"
        rows={revenueByCategory.map((c) => ({
          label: c.name,
          value: c.total,
          display: formatINR(c.total),
        }))}
      />
    </div>
  );
}
