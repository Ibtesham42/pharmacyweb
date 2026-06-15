"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/site";

export function ShareButtons({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(path);

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
    } else {
      await copy();
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
      <Button variant="outline" size="sm" onClick={nativeShare}>
        <Share2 className="h-4 w-4" /> Share
      </Button>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} Copy link
      </Button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary underline-offset-2 hover:underline"
      >
        WhatsApp
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary underline-offset-2 hover:underline"
      >
        Telegram
      </a>
    </div>
  );
}
