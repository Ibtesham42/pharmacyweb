import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact, non-intrusive "Support Us" call-to-action. Server component. */
export function DonateCta({
  source = "cta",
  className,
  variant = "card",
}: {
  source?: string;
  className?: string;
  variant?: "card" | "inline";
}) {
  const href = `/donate?src=${encodeURIComponent(source)}`;

  if (variant === "inline") {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline",
          className,
        )}
      >
        <Heart className="h-4 w-4" /> Support us
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-accent/40 p-5 transition-colors hover:border-primary",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Heart className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold">Support PharmaCareers</p>
          <p className="text-sm text-muted-foreground">
            Help keep jobs, medical content & AI tools free for the community.
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Donate
      </span>
    </Link>
  );
}
