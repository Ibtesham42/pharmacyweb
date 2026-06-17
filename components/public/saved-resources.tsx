"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Bookmark, FileText, Star, X } from "lucide-react";
import type { ResourceType, ResourceAccess } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RESOURCE_TYPE_LABELS, avgRating } from "@/lib/marketplace/config";
import { formatINR } from "@/lib/format";

export interface SavedItem {
  id: string;
  title: string;
  slug: string;
  type: ResourceType;
  access: ResourceAccess;
  pricePaise: number;
  previewImages: string[];
  ratingSum: number;
  ratingCount: number;
}

export function SavedResources({ initial }: { initial: SavedItem[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(item: SavedItem) {
    setBusy(item.id);
    try {
      const res = await fetch(`/api/resources/${item.slug}/bookmark`, { method: "POST" });
      const data = (await res.json()) as { bookmarked?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not update");
      // toggle returns bookmarked:false → it was removed. Re-add if it somehow flipped on.
      if (data.bookmarked) {
        toast.message("Still saved");
      } else {
        setItems((prev) => prev.filter((x) => x.id !== item.id));
        toast.success("Removed from saved");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <Bookmark className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No saved resources yet.</p>
        <Button asChild variant="link" className="mt-1">
          <Link href="/store">Browse resources</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((r) => {
        const rating = avgRating(r.ratingSum, r.ratingCount);
        return (
          <Card key={r.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded border bg-muted">
                {r.previewImages[0] ? (
                  <Image src={r.previewImages[0]} alt="" fill className="object-cover" sizes="56px" unoptimized />
                ) : (
                  <FileText className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/store/${r.slug}`} className="block truncate font-medium hover:underline">
                  {r.title}
                </Link>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{RESOURCE_TYPE_LABELS[r.type]}</span>
                  <span aria-hidden>·</span>
                  <span className="font-medium text-foreground">
                    {r.access === "FREE" ? "Free" : formatINR(r.pricePaise)}
                  </span>
                  {r.ratingCount > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {rating.toFixed(1)}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={busy === r.id}
                onClick={() => remove(r)}
                aria-label={`Remove ${r.title} from saved`}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
