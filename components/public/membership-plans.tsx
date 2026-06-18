"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Check, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourcePurchaseForm } from "@/components/public/resource-purchase-form";
import { formatINR } from "@/lib/format";
import { durationLabel } from "@/lib/marketplace/config";
import { cn } from "@/lib/utils";

export interface MembershipPlanView {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  pricePaise: number;
  badge: string | null;
  benefits: string[];
}

const PERKS = [
  "Download every paid & premium resource",
  "Access all current and future PREMIUM material",
  "Re-download anytime from your account",
];

export function MembershipPlans({
  plans,
  razorpayAvailable,
  upiAvailable,
  defaultName,
  defaultEmail,
  authed,
  isMember,
  memberUntil,
}: {
  plans: MembershipPlanView[];
  razorpayAvailable: boolean;
  upiAvailable: boolean;
  defaultName: string;
  defaultEmail: string;
  authed: boolean;
  isMember: boolean;
  memberUntil?: string;
}) {
  const [selected, setSelected] = useState<MembershipPlanView | null>(null);

  return (
    <div className="space-y-6">
      {isMember && (
        <div className="rounded-lg border bg-accent/40 p-4 text-center text-sm">
          <Crown className="mx-auto mb-1 h-5 w-5 text-primary" />
          You’re PREMIUM{memberUntil ? ` until ${memberUntil}` : ""}. Buying again extends your access.
        </div>
      )}

      <ul className="mx-auto grid max-w-md gap-2 text-sm text-muted-foreground">
        {PERKS.map((p) => (
          <li key={p} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" /> {p}
          </li>
        ))}
      </ul>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className={cn(selected?.id === p.id && "border-primary ring-1 ring-primary")}>
            <CardContent className="flex h-full flex-col gap-2 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {p.badge && <Badge variant="accent">{p.badge}</Badge>}
              </div>
              <p className="text-2xl font-bold">{formatINR(p.pricePaise)}</p>
              <p className="text-sm text-muted-foreground">{durationLabel(p.durationDays)} of PREMIUM</p>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              {p.benefits.length > 0 && (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {b}
                    </li>
                  ))}
                </ul>
              )}
              {authed ? (
                <Button
                  className="mt-auto"
                  variant={selected?.id === p.id ? "secondary" : "default"}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                >
                  <Crown className="h-4 w-4" /> {selected?.id === p.id ? "Selected" : isMember ? "Extend with this plan" : "Get PREMIUM"}
                </Button>
              ) : (
                // Guests can view plans but must sign in to purchase — return here afterwards.
                <Button asChild className="mt-auto">
                  <Link href="/login?next=/membership">
                    <LogIn className="h-4 w-4" /> Sign in to go PREMIUM
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <Card className="mx-auto max-w-md">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-semibold">
              {selected.name} · {formatINR(selected.pricePaise)} · {durationLabel(selected.durationDays)}
            </p>
            <ResourcePurchaseForm
              slug={selected.id}
              pricePaise={selected.pricePaise}
              razorpayAvailable={razorpayAvailable}
              upiAvailable={upiAvailable}
              defaultName={defaultName}
              defaultEmail={defaultEmail}
              purchaseUrl={`/api/membership/${selected.id}/purchase`}
              verifyUrl="/api/membership/purchase/verify"
              manualUrl="/api/membership/purchase/manual"
              buyLabel={isMember ? "Extend PREMIUM" : "Get PREMIUM"}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
