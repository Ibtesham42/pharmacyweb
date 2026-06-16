import Link from "next/link";
import { Plus } from "lucide-react";
import { listAdminResources } from "@/services/resources";
import { pendingReviewCount } from "@/services/resource-reviews";
import { ResourceAdminTabs } from "@/components/admin/resource-admin-tabs";
import { ResourceRowActions } from "@/components/admin/resource-row-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/format";
import { RESOURCE_TYPE_LABELS } from "@/lib/marketplace/config";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["", "PUBLISHED", "DRAFT", "ARCHIVED"];

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const [result, pending] = await Promise.all([
    safe(listAdminResources({ status: sp.status, q: sp.q, page: Number(sp.page ?? 1) }), {
      items: [],
      total: 0,
      page: 1,
      perPage: 20,
      pages: 1,
    }),
    safe(pendingReviewCount(), 0),
  ]);

  const buildHref = (status: string) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (sp.q) p.set("q", sp.q);
    return `/admin/resources?${p.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Resources</h1>
          <p className="text-sm text-muted-foreground">Digital downloads — notes, papers, mock tests and more.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/resources/new">
            <Plus className="h-4 w-4" /> New resource
          </Link>
        </Button>
      </div>

      <ResourceAdminTabs active="/admin/resources" pendingReviews={pending} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((st) => (
            <Link
              key={st || "all"}
              href={buildHref(st)}
              className={`rounded-md px-3 py-1 text-sm ${
                (sp.status ?? "") === st ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {st || "All"}
            </Link>
          ))}
        </div>
        <form className="ml-auto" action="/admin/resources">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search resources…"
            className="h-9 w-56 rounded-md border bg-background px-3 text-sm"
          />
        </form>
      </div>

      <Card className="overflow-hidden">
        {result.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No resources found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Downloads</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/resources/${r.id}`} className="font-medium hover:underline">
                        {r.title}
                      </Link>
                      {r.category && <span className="ml-2 text-xs text-muted-foreground">{r.category.name}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">{RESOURCE_TYPE_LABELS[r.type]}</td>
                    <td className="px-4 py-3">
                      {r.access === "FREE" ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : r.access === "PAID" ? (
                        <Badge variant="accent">{formatINR(r.pricePaise)}</Badge>
                      ) : (
                        <Badge variant="warning">Premium</Badge>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{r.downloadCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === "PUBLISHED" ? "success" : "secondary"}>{r.status}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                      {formatDate(r.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ResourceRowActions id={r.id} status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {result.pages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/resources?${new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), ...(sp.q ? { q: sp.q } : {}), page: String(n) }).toString()}`}
              className={`rounded-md px-3 py-1 text-sm ${n === result.page ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
