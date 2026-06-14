import Link from "next/link";
import { Plus } from "lucide-react";
import { PostStatus, PostType } from "@prisma/client";
import { listAllPosts } from "@/services/posts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PostRowActions } from "@/components/admin/post-row-actions";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<PostStatus, "success" | "secondary" | "warning" | "outline"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  SCHEDULED: "warning",
  ARCHIVED: "outline",
};

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "JOB", label: "Jobs" },
  { value: "ARTICLE", label: "Articles" },
  { value: "NEWS", label: "News" },
];

type SP = { type?: string; status?: string; q?: string; page?: string };

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const type = (["JOB", "NEWS", "ARTICLE"].includes(sp.type ?? "") ? sp.type : undefined) as
    | PostType
    | undefined;
  const status = (["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"].includes(sp.status ?? "")
    ? sp.status
    : undefined) as PostStatus | undefined;

  const result = await listAllPosts({ type, status, q: sp.q, page: Number(sp.page ?? 1) });

  const typeHref = (t: string) => {
    const p = new URLSearchParams();
    if (t) p.set("type", t);
    if (sp.q) p.set("q", sp.q);
    return `/admin/posts?${p.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Posts</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/posts/new?type=JOB"><Plus className="h-4 w-4" /> Job</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/posts/new?type=ARTICLE"><Plus className="h-4 w-4" /> Article</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/posts/new?type=NEWS"><Plus className="h-4 w-4" /> News</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {TYPE_FILTERS.map((t) => (
            <Link
              key={t.value}
              href={typeHref(t.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm",
                (sp.type ?? "") === t.value && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form className="ml-auto" action="/admin/posts">
          {type && <input type="hidden" name="type" value={type} />}
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search title…"
            className="h-9 w-48 rounded-md border bg-background px-3 text-sm"
          />
        </form>
      </div>

      <Card className="overflow-hidden">
        {result.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No posts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Category</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/posts/${p.id}`} className="font-medium hover:text-primary">
                        {p.title}
                      </Link>
                      {p.jobDetail?.companyName && (
                        <p className="text-xs text-muted-foreground">{p.jobDetail.companyName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{p.type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {p.category?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formatDate(p.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <PostRowActions id={p.id} status={p.status} />
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
              href={`/admin/posts?page=${n}${type ? `&type=${type}` : ""}`}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm",
                n === result.page && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
