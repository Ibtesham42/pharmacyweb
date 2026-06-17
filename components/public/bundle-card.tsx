import Link from "next/link";
import Image from "next/image";
import { Package, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import type { BundleCard as BundleCardData } from "@/services/bundles";

export function BundleCard({ bundle: b }: { bundle: BundleCardData }) {
  return (
    <Link
      href={`/exam-prep/${b.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border transition-colors hover:border-primary"
    >
      <div className="relative aspect-[16/10] bg-muted">
        {b.coverImage ? (
          <Image src={b.coverImage} alt={b.title} fill className="object-cover" sizes="400px" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/60 to-muted">
            <Package className="h-10 w-10 text-primary/50" />
          </div>
        )}
        <span className="absolute left-2 top-2">
          <Badge variant="accent">{formatINR(b.pricePaise)}</Badge>
        </span>
        {b.examType && <span className="absolute right-2 top-2"><Badge variant="secondary">{b.examType}</Badge></span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-semibold group-hover:text-primary">{b.title}</h3>
        {b.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{b.excerpt}</p>}
        <div className="mt-auto flex items-center gap-1 pt-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" /> {b._count.items} {b._count.items === 1 ? "resource" : "resources"}
        </div>
      </div>
    </Link>
  );
}
