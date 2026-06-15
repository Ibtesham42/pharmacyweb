"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAiSettingsAction } from "@/app/admin/(panel)/ai/actions";
import {
  AI_MODELS,
  AI_VISION_MODELS,
  AI_MODE_LABELS,
  AI_MODE_KEYS,
  type AiSettings,
  type AiModeKey,
} from "@/lib/ai/config";

export function AiSettingsForm({
  settings,
  groqConfigured,
}: {
  settings: AiSettings;
  groqConfigured: boolean;
}) {
  const router = useRouter();
  const [s, setS] = useState<AiSettings>(settings);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof AiSettings>(key: K, value: AiSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }
  function setMode(mode: AiModeKey, value: boolean) {
    setS((prev) => ({ ...prev, modes: { ...prev.modes, [mode]: value } }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await updateAiSettingsAction(s);
    setBusy(false);
    if (res.ok) {
      toast.success("AI settings saved");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row
            label="Enable AI assistant"
            hint={groqConfigured ? "Groq key: configured ✓" : "Groq key: NOT configured"}
          >
            <Switch checked={s.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </Row>
          <Row label="Maintenance mode" hint="Temporarily pause AI for users.">
            <Switch checked={s.maintenanceMode} onCheckedChange={(v) => set("maintenanceMode", v)} />
          </Row>
          <div className="space-y-1.5">
            <Label>Default model</Label>
            <Select value={s.model} onValueChange={(v) => set("model", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fast model</Label>
            <Select value={s.fastModel} onValueChange={(v) => set("fastModel", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limits & generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Num label="Temperature (0–2)" value={s.temperature} step={0.1} min={0} max={2} onChange={(v) => set("temperature", v)} />
          <Num label="Max output tokens" value={s.maxOutputTokens} min={128} max={8192} onChange={(v) => set("maxOutputTokens", v)} />
          <Num label="Per-minute limit (per IP)" value={s.perMinuteLimit} min={1} max={120} onChange={(v) => set("perMinuteLimit", v)} />
          <Num label="Per-user daily limit" value={s.perUserDailyLimit} min={1} max={10000} onChange={(v) => set("perUserDailyLimit", v)} />
          <Num label="Global daily limit" value={s.dailyLimit} min={1} max={100000} onChange={(v) => set("dailyLimit", v)} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Multimodal (image &amp; document)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Row label="Image analysis" hint="Allow users to upload photos (medicine, plant, device, reports).">
            <Switch
              checked={s.imageAnalysisEnabled}
              onCheckedChange={(v) => set("imageAnalysisEnabled", v)}
            />
          </Row>
          <Row label="Document analysis" hint="Allow users to upload PDF / DOCX / TXT.">
            <Switch
              checked={s.documentAnalysisEnabled}
              onCheckedChange={(v) => set("documentAnalysisEnabled", v)}
            />
          </Row>
          <div className="space-y-1.5">
            <Label>Vision model</Label>
            <Select value={s.visionModel} onValueChange={(v) => set("visionModel", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_VISION_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Num label="Max uploads / user / day" value={s.maxUploadsPerDay} min={1} max={1000} onChange={(v) => set("maxUploadsPerDay", v)} />
          <Num label="Max image size (MB)" value={s.maxImageMB} min={1} max={25} onChange={(v) => set("maxImageMB", v)} />
          <Num label="Max document size (MB)" value={s.maxDocMB} min={1} max={50} onChange={(v) => set("maxDocMB", v)} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Knowledge modes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AI_MODE_KEYS.map((m) => (
            <Row key={m} label={AI_MODE_LABELS[m]}>
              <Switch checked={s.modes[m]} onCheckedChange={(v) => setMode(m, v)} />
            </Row>
          ))}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save AI settings"}
        </Button>
      </div>
    </form>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
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

function Num({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
