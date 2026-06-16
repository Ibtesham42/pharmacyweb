"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Star, Save, Loader2 } from "lucide-react";
import { DonationStatus, FeatureStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  setFeatureStatusAction,
  setFeaturedMessageAction,
} from "@/app/admin/(panel)/donations/actions";
import { formatINR, formatDate } from "@/lib/format";

export type SupporterRow = {
  id: string;
  name: string;
  email: string;
  amountPaise: number;
  status: DonationStatus;
  anonymous: boolean;
  supporterConsent: boolean;
  featureStatus: FeatureStatus;
  featuredMessage: string | null;
  createdAt: Date;
  paidAt: Date | null;
};

const FEATURE_BADGE: Record<FeatureStatus, { label: string; variant: "warning" | "success" | "secondary" | "outline" }> = {
  PENDING: { label: "Pending review", variant: "warning" },
  APPROVED: { label: "Featured", variant: "success" },
  REJECTED: { label: "Not featured", variant: "secondary" },
  NONE: { label: "No request", variant: "outline" },
};

export function SupportersTable({ supporters }: { supporters: SupporterRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: FeatureStatus) {
    setBusyId(id);
    const res = await setFeatureStatusAction(id, status);
    setBusyId(null);
    if (res.ok) {
      toast.success(status === FeatureStatus.APPROVED ? "Supporter featured" : "Updated");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (!supporters.length) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No supporter opt-ins yet. Donors who tick “You may feature me as a supporter” appear here for review.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Only <strong>paid</strong> donations you approve appear publicly. Anonymous donors are shown as
        “Anonymous Supporter”. Email is never shown on the public site.
      </p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2 font-medium">Donor</th>
              <th className="p-2 font-medium">Amount</th>
              <th className="p-2 font-medium">Date</th>
              <th className="p-2 font-medium">Privacy</th>
              <th className="p-2 font-medium">Consent</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Public thank-you message</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {supporters.map((s) => (
              <tr key={s.id} className="border-t align-top">
                <td className="p-2">
                  {s.name}
                  <br />
                  <span className="text-xs text-muted-foreground">{s.email}</span>
                </td>
                <td className="p-2">
                  <span className="font-medium">{formatINR(s.amountPaise)}</span>
                  <br />
                  <Badge variant={s.status === "PAID" ? "success" : "secondary"} className="mt-0.5">
                    {s.status}
                  </Badge>
                </td>
                <td className="p-2 text-xs text-muted-foreground">{formatDate(s.createdAt)}</td>
                <td className="p-2">
                  {s.anonymous ? (
                    <Badge variant="warning">Anonymous</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Public name</span>
                  )}
                </td>
                <td className="p-2">
                  {s.supporterConsent ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </td>
                <td className="p-2">
                  <Badge variant={FEATURE_BADGE[s.featureStatus].variant}>
                    {FEATURE_BADGE[s.featureStatus].label}
                  </Badge>
                </td>
                <td className="p-2">
                  <MessageEditor id={s.id} initial={s.featuredMessage ?? ""} />
                </td>
                <td className="p-2">
                  <div className="flex flex-col gap-1">
                    {s.featureStatus !== FeatureStatus.APPROVED && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === s.id}
                        onClick={() => setStatus(s.id, FeatureStatus.APPROVED)}
                        title={
                          s.status !== "PAID"
                            ? "This donation is not marked paid yet — it won’t show publicly until paid."
                            : undefined
                        }
                      >
                        <Star className="h-3.5 w-3.5" />
                        {s.featureStatus === FeatureStatus.PENDING ? "Approve" : "Feature"}
                      </Button>
                    )}
                    {s.featureStatus !== FeatureStatus.REJECTED && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === s.id}
                        onClick={() => setStatus(s.id, FeatureStatus.REJECTED)}
                      >
                        <X className="h-3.5 w-3.5" />
                        {s.featureStatus === FeatureStatus.APPROVED ? "Remove" : "Reject"}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MessageEditor({ id, initial }: { id: string; initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const dirty = value.trim() !== initial.trim();

  async function save() {
    setBusy(true);
    const res = await setFeaturedMessageAction(id, value);
    setBusy(false);
    if (res.ok) {
      toast.success("Message saved");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex items-start gap-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Optional — shown publicly"
        maxLength={280}
        className="h-8 min-w-[180px] text-xs"
      />
      {dirty && (
        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" disabled={busy} onClick={save}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}
