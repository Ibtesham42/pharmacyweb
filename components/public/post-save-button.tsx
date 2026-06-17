"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Save/unsave a job, article or news post. Self-fetches its state on mount so it
 * can live on statically-rendered pages. Guests are routed to sign in.
 */
export function PostSaveButton({
  slug,
  path,
  size = "default",
}: {
  slug: string;
  path: string; // the post's own URL — the post-login return target
  size?: "default" | "sm";
}) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/posts/${slug}/bookmark`)
      .then((r) => r.json())
      .then((d: { signedIn?: boolean; bookmarked?: boolean }) => {
        if (!active) return;
        setSignedIn(Boolean(d.signedIn));
        setBookmarked(Boolean(d.bookmarked));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [slug]);

  async function toggle() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(path)}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${slug}/bookmark`, { method: "POST" });
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
    <Button type="button" variant="outline" size={size} onClick={toggle} disabled={busy} aria-pressed={bookmarked}>
      {bookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
      {bookmarked ? "Saved" : "Save"}
    </Button>
  );
}
