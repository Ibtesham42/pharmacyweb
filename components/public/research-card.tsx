import Link from "next/link";
import { FileText, Download, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import { RESOURCE_TYPE_LABELS } from "@/lib/marketplace/config";
import type { ResearchCard as ResearchCardData } from "@/services/resources";

export function ResearchCard({ resource: r }: { resource: ResearchCardData }) {
  return (
    <Link
      href={`/store/${r.slug}`}
      className="group flex h-full flex-col gap-2 rounded-lg border p-4 transition-colors hover:border-primary"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[11px]">
          <FileText className="mr-1 h-3 w-3" /> {RESOURCE_TYPE_LABELS[r.type]}
        </Badge>
        {r.publishedYear && <span className="text-xs text-muted-foreground">{r.publishedYear}</span>}
        <span className="ml-auto">
          {r.access === "FREE" ? (
            <Badge variant="success">Free</Badge>
          ) : r.access === "PAID" ? (
            <Badge variant="accent">{formatINR(r.pricePaise)}</Badge>
          ) : (
            <Badge variant="warning">Premium</Badge>
          )}
        </span>
      </div>

      <h3 className="line-clamp-2 font-semibold group-hover:text-primary">{r.title}</h3>
      {r.author && <p className="text-xs text-muted-foreground">By {r.author}</p>}

      {(r.abstract || r.excerpt) && (
        <p className="line-clamp-3 text-sm text-muted-foreground">{r.abstract || r.excerpt}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
        {r.category ? <span className="truncate">{r.category.name}</span> : <span>{r.doi ? <span className="inline-flex items-center gap-1"><Quote className="h-3 w-3" /> DOI</span> : "PharmaCareers"}</span>}
        <span className="flex items-center gap-1">
          <Download className="h-3.5 w-3.5" /> {r.downloadCount}
        </span>
      </div>
    </Link>
  );
}
