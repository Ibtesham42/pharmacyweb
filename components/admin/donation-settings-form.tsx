"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateDonationSettingsAction } from "@/app/admin/(panel)/donations/actions";
import { uploadToCloudinary } from "@/lib/upload-client";
import type { DonationSettings } from "@/lib/donations/config";

export function DonationSettingsForm({
  settings,
  razorpayConfigured,
}: {
  settings: DonationSettings;
  razorpayConfigured: boolean;
}) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [amounts, setAmounts] = useState(
    settings.suggestedAmounts.map((p) => Math.round(p / 100)).join(", "),
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set<K extends keyof DonationSettings>(k: K, v: DonationSettings[K]) {
    setS((p) => ({ ...p, [k]: v }));
  }

  function setThreshold(tier: keyof DonationSettings["badgeThresholds"], rupees: number) {
    setS((p) => ({
      ...p,
      badgeThresholds: { ...p.badgeThresholds, [tier]: Math.max(1, rupees) * 100 },
    }));
  }

  async function onQr(file: File) {
    setUploading(true);
    try {
      const m = await uploadToCloudinary(file);
      set("qrImageUrl", m.url);
      toast.success("QR uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const suggested = amounts
      .split(",")
      .map((x) => Math.round(Number(x.trim()) * 100))
      .filter((n) => n > 0);
    const res = await updateDonationSettingsAction({ ...s, suggestedAmounts: suggested });
    setBusy(false);
    if (res.ok) {
      toast.success("Saved");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={save}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Donation settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row
            label="Enable donations"
            hint={razorpayConfigured ? "Razorpay: configured ✓" : "Razorpay: not configured (UPI still works)"}
          >
            <Switch checked={s.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </Row>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <Input value={s.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="UPI ID">
              <Input value={s.upiId} onChange={(e) => set("upiId", e.target.value)} placeholder="name@bank" />
            </Field>
          </div>

          <Field label="Short message">
            <Textarea value={s.message} onChange={(e) => set("message", e.target.value)} rows={2} />
          </Field>
          <Field label="Page content">
            <Textarea value={s.pageContent} onChange={(e) => set("pageContent", e.target.value)} rows={3} />
          </Field>
          <Field label="Thank-you message">
            <Input value={s.thankYouMessage} onChange={(e) => set("thankYouMessage", e.target.value)} />
          </Field>

          <div className="space-y-1.5">
            <Label>UPI QR image</Label>
            <div className="flex items-center gap-3">
              <input
                id="donation-qr"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) void onQr(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("donation-qr")?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload QR
              </Button>
              {s.qrImageUrl && (
                <Image src={s.qrImageUrl} alt="QR" width={56} height={56} className="rounded border" unoptimized />
              )}
            </div>
            <Input
              value={s.qrImageUrl}
              onChange={(e) => set("qrImageUrl", e.target.value)}
              placeholder="…or paste a QR image URL"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Minimum amount (₹)">
              <Input
                type="number"
                value={Math.round(s.minAmountPaise / 100)}
                onChange={(e) => set("minAmountPaise", Math.max(1, Number(e.target.value)) * 100)}
              />
            </Field>
            <Field label="Suggested amounts (₹, comma-separated)">
              <Input value={amounts} onChange={(e) => setAmounts(e.target.value)} />
            </Field>
            <Field label="Overall goal (₹, 0 = none)">
              <Input
                type="number"
                value={Math.round(s.goalPaise / 100)}
                onChange={(e) => set("goalPaise", Math.max(0, Number(e.target.value)) * 100)}
              />
            </Field>
            <Field label="Monthly goal (₹, 0 = none)">
              <Input
                type="number"
                value={Math.round(s.monthlyGoalPaise / 100)}
                onChange={(e) => set("monthlyGoalPaise", Math.max(0, Number(e.target.value)) * 100)}
              />
            </Field>
          </div>

          {/* ── Featured Supporters ── */}
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-semibold">Featured Supporters</p>
            <Row
              label="Enable Featured Supporters section"
              hint="Show approved supporters publicly. Donors must opt in and be approved by you."
            >
              <Switch checked={s.featuredEnabled} onCheckedChange={(v) => set("featuredEnabled", v)} />
            </Row>
            <Row label="Show on homepage">
              <Switch checked={s.featuredOnHomepage} onCheckedChange={(v) => set("featuredOnHomepage", v)} />
            </Row>
            <Row label="Show on donation page">
              <Switch checked={s.featuredOnDonatePage} onCheckedChange={(v) => set("featuredOnDonatePage", v)} />
            </Row>
            <Field label="Maximum supporters to show">
              <Input
                type="number"
                min={1}
                max={60}
                value={s.featuredMaxShow}
                onChange={(e) => set("featuredMaxShow", Math.max(1, Number(e.target.value)))}
                className="max-w-[140px]"
              />
            </Field>

            <div className="space-y-1.5">
              <Label>Badge thresholds (₹ — minimum donation for each tier)</Label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(["bronze", "silver", "gold", "platinum"] as const).map((tier) => (
                  <Field key={tier} label={tier[0].toUpperCase() + tier.slice(1)}>
                    <Input
                      type="number"
                      min={1}
                      value={Math.round(s.badgeThresholds[tier] / 100)}
                      onChange={(e) => setThreshold(tier, Number(e.target.value))}
                    />
                  </Field>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Donations below the Bronze threshold get the base “Supporter” badge. Thresholds must increase
                across tiers.
              </p>
            </div>
          </div>

          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
