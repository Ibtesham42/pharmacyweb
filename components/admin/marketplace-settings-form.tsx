"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateMarketplaceSettingsAction } from "@/app/admin/(panel)/resources/actions";
import { uploadToCloudinary } from "@/lib/upload-client";
import type { MarketplaceSettings } from "@/lib/marketplace/config";

export function MarketplaceSettingsForm({
  settings,
  razorpayConfigured,
}: {
  settings: MarketplaceSettings;
  razorpayConfigured: boolean;
}) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set<K extends keyof MarketplaceSettings>(k: K, v: MarketplaceSettings[K]) {
    setS((p) => ({ ...p, [k]: v }));
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
    const res = await updateMarketplaceSettingsAction(s);
    setBusy(false);
    if (res.ok) {
      toast.success("Saved");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <form onSubmit={save}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marketplace settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label="Enable store" hint={razorpayConfigured ? "Razorpay: configured ✓" : "Razorpay: not configured (UPI still works)"}>
            <Switch checked={s.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </Row>
          <Row label="Require an account for free downloads" hint="Off = anyone can download free resources">
            <Switch checked={s.freeRequiresAccount} onCheckedChange={(v) => set("freeRequiresAccount", v)} />
          </Row>
          <Row label="Reviews require moderation" hint="Approved reviews show publicly">
            <Switch checked={s.reviewsRequireModeration} onCheckedChange={(v) => set("reviewsRequireModeration", v)} />
          </Row>
          <Row label="Allow UPI / QR fallback for paid resources">
            <Switch checked={s.upiFallbackEnabled} onCheckedChange={(v) => set("upiFallbackEnabled", v)} />
          </Row>
          <Row label="Premium tier shown as “coming soon”">
            <Switch checked={s.premiumComingSoon} onCheckedChange={(v) => set("premiumComingSoon", v)} />
          </Row>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Featured resources to show">
              <Input
                type="number"
                min={1}
                max={60}
                value={s.featuredCount}
                onChange={(e) => set("featuredCount", Math.max(1, Number(e.target.value)))}
              />
            </Field>
            <Field label="UPI ID (for paid fallback)">
              <Input value={s.upiId} onChange={(e) => set("upiId", e.target.value)} placeholder="name@bank" />
            </Field>
          </div>

          <div className="space-y-1.5">
            <Label>UPI QR image</Label>
            <div className="flex items-center gap-3">
              <input
                id="mp-qr"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) void onQr(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("mp-qr")?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload QR
              </Button>
              {s.qrImageUrl && (
                <Image src={s.qrImageUrl} alt="QR" width={56} height={56} className="rounded border" unoptimized />
              )}
            </div>
            <Input value={s.qrImageUrl} onChange={(e) => set("qrImageUrl", e.target.value)} placeholder="…or paste a QR image URL" />
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
