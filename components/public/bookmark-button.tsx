"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookmarkButton({
  slug,
  initialBookmarked,
  signedIn,
}: {
  slug: string;
  initialBookmarked: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push(`/account/login?next=${encodeURIComponent(`/store/${slug}`)}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/resources/${slug}/bookmark`, { method: "POST" });
      const data = (await res.json()) as { bookmarked?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save");
      setBookmarked(Boolean(data.bookmarked));
      toast.success(data.bookmarked ? "Saved to your account" : "Removed from saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={toggle} disabled={busy} aria-pressed={bookmarked}>
      {bookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
      {bookmarked ? "Saved" : "Save"}
    </Button>
  );
}
