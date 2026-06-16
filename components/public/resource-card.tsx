import Link from "next/link";
import Image from "next/image";
import { FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/public/rating-stars";
import { formatINR } from "@/lib/format";
import { RESOURCE_TYPE_LABELS, avgRating } from "@/lib/marketplace/config";
import type { ResourceCard as ResourceCardData } from "@/services/resources";

export function ResourceCard({ resource: r }: { resource: ResourceCardData }) {
  const cover = r.previewImages[0];
  const rating = avgRating(r.ratingSum, r.ratingCount);

  return (
    <Link
      href={`/store/${r.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border transition-colors hover:border-primary"
    >
      <div className="relative aspect-[16/10] bg-muted">
        {cover ? (
          <Image src={cover} alt={r.title} fill className="object-cover" sizes="400px" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/60 to-muted">
            <FileText className="h-10 w-10 text-primary/50" />
          </div>
        )}
        <span className="absolute left-2 top-2">
          {r.access === "FREE" ? (
            <Badge variant="success">Free</Badge>
          ) : r.access === "PAID" ? (
            <Badge variant="accent">{formatINR(r.pricePaise)}</Badge>
          ) : (
            <Badge variant="warning">Premium</Badge>
          )}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Badge variant="outline" className="w-fit text-[11px]">
          {RESOURCE_TYPE_LABELS[r.type]}
        </Badge>
        <h3 className="line-clamp-2 font-semibold group-hover:text-primary">{r.title}</h3>
        {r.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{r.excerpt}</p>}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          {r.ratingCount > 0 ? (
            <span className="flex items-center gap-1">
              <RatingStars value={rating} size={13} /> {rating}
            </span>
          ) : (
            <span>{r.author || "PharmaCareers"}</span>
          )}
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" /> {r.downloadCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
