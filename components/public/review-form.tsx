"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RatingStars } from "@/components/public/rating-stars";

export function ReviewForm({
  slug,
  initial,
}: {
  slug: string;
  initial?: { rating: number; title?: string | null; body?: string | null; status?: string };
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return toast.error("Please choose a star rating");
    setBusy(true);
    try {
      const res = await fetch(`/api/resources/${slug}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, body }),
      });
      const data = (await res.json()) as { ok?: boolean; pending?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not submit review");
      toast.success(data.pending ? "Review submitted — pending approval" : "Thanks for your review!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label>Your rating</Label>
        <RatingStars value={rating} onChange={setRating} size={24} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rev-title">Title (optional)</Label>
        <Input id="rev-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rev-body">Review (optional)</Label>
        <Textarea id="rev-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000} />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {initial ? "Update review" : "Submit review"}
      </Button>
      {initial?.status === "PENDING" && (
        <p className="text-xs text-muted-foreground">Your review is awaiting moderation.</p>
      )}
    </form>
  );
}
