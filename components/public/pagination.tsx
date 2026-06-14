import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Server-rendered pagination. `buildHref(page)` returns the URL for a page so it
 * works for any list route while preserving existing query params.
 */
export function Pagination({
  page,
  pages,
  buildHref,
}: {
  page: number;
  pages: number;
  buildHref: (page: number) => string;
}) {
  if (pages <= 1) return null;

  const window = 2;
  const nums: number[] = [];
  for (let p = Math.max(1, page - window); p <= Math.min(pages, page + window); p++) nums.push(p);

  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm";

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      {page > 1 && (
        <Link href={buildHref(page - 1)} className={base} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {nums[0] > 1 && (
        <>
          <Link href={buildHref(1)} className={base}>1</Link>
          {nums[0] > 2 && <span className="px-1 text-muted-foreground">…</span>}
        </>
      )}
      {nums.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(base, p === page && "border-primary bg-primary text-primary-foreground")}
        >
          {p}
        </Link>
      ))}
      {nums[nums.length - 1] < pages && (
        <>
          {nums[nums.length - 1] < pages - 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Link href={buildHref(pages)} className={base}>{pages}</Link>
        </>
      )}
      {page < pages && (
        <Link href={buildHref(page + 1)} className={base} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
