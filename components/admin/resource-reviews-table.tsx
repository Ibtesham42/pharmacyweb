"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { ReviewStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/public/rating-stars";
import { moderateReviewAction } from "@/app/admin/(panel)/resources/actions";
import { formatDate } from "@/lib/format";

type Row = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  createdAt: Date;
  buyer: { name: string | null; email: string };
  resource: { title: string; slug: string };
};

const VARIANT: Record<ReviewStatus, "success" | "warning" | "secondary"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "secondary",
};

export function ResourceReviewsTable({ reviews }: { reviews: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function moderate(id: string, status: ReviewStatus) {
    setBusyId(id);
    const res = await moderateReviewAction(id, status);
    setBusyId(null);
    if (res.ok) {
      toast.success("Updated");
      router.refresh();
    } else toast.error(res.error);
  }

  if (!reviews.length) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No reviews yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-md border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RatingStars value={r.rating} />
              <Badge variant={VARIANT[r.status]}>{r.status}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm">
            <span className="font-medium">{r.resource.title}</span> ·{" "}
            <span className="text-muted-foreground">{r.buyer.name || r.buyer.email}</span>
          </p>
          {r.title && <p className="mt-1 font-medium">{r.title}</p>}
          {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
          <div className="mt-2 flex gap-1">
            {r.status !== ReviewStatus.APPROVED && (
              <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => moderate(r.id, ReviewStatus.APPROVED)}>
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
            )}
            {r.status !== ReviewStatus.REJECTED && (
              <Button size="sm" variant="ghost" disabled={busyId === r.id} onClick={() => moderate(r.id, ReviewStatus.REJECTED)}>
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
