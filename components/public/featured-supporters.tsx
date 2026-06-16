import { Award, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { PublicSupporter } from "@/lib/donations/config";

/**
 * Public wall of approved supporters. Receives an already privacy-filtered list
 * (see `getPublicFeaturedSupporters`) — no email/phone/address/amount is exposed.
 */
export function FeaturedSupporters({
  supporters,
  title = "Our Supporters",
  subtitle = "Thank you to the people who keep this platform free for everyone.",
}: {
  supporters: PublicSupporter[];
  title?: string;
  subtitle?: string;
}) {
  if (!supporters.length) return null;

  return (
    <section aria-labelledby="featured-supporters-heading">
      <div className="mb-4 text-center">
        <h2
          id="featured-supporters-heading"
          className="flex items-center justify-center gap-2 text-xl font-bold tracking-tight sm:text-2xl"
        >
          <Heart className="h-5 w-5 text-primary" /> {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {supporters.map((s) => (
          <li key={s.id}>
            <Card className="h-full">
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Award className="h-4 w-4 text-primary" /> {s.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      s.levelClassName,
                    )}
                  >
                    {s.levelLabel}
                  </span>
                </div>
                {s.message && <p className="text-sm text-muted-foreground">“{s.message}”</p>}
                <p className="mt-auto text-xs text-muted-foreground">{formatDate(s.date)}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
