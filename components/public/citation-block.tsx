"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CitationBlock({ citation, doi }: { citation?: string | null; doi?: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!citation && !doi) return null;

  const text = citation || (doi ? `https://doi.org/${doi}` : "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mt-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Quote className="h-4 w-4 text-primary" /> How to cite
        </h2>
        {citation && (
          <Button type="button" variant="ghost" size="sm" onClick={copy} aria-label="Copy citation">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        )}
      </div>
      {citation && <p className="mt-1 text-sm text-muted-foreground">{citation}</p>}
      {doi && (
        <a
          href={`https://doi.org/${doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> doi.org/{doi}
        </a>
      )}
    </div>
  );
}
