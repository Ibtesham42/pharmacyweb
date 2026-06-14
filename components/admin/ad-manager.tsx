"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAdAction, updateAdAction, deleteAdAction } from "@/app/admin/(panel)/ads/actions";

interface Ad {
  id: string;
  name: string;
  slot: string;
  type: string;
  adsenseSlotId: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  isActive: boolean;
  impressions: number;
  clicks: number;
}

const SLOTS = ["HOMEPAGE_TOP", "SIDEBAR", "IN_CONTENT", "BETWEEN_CONTENT", "FOOTER", "JOB_PAGE"];
const TYPES = ["ADSENSE", "BANNER_IMAGE", "HTML"];

export function AdManager({ ads }: { ads: Ad[] }) {
  const router = useRouter();
  const [newAd, setNewAd] = useState({ name: "", slot: "HOMEPAGE_TOP", type: "ADSENSE" });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await createAdAction({ ...newAd, isActive: false });
    if (res.ok) {
      toast.success("Ad created");
      setNewAd({ name: "", slot: "HOMEPAGE_TOP", type: "ADSENSE" });
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <form onSubmit={create} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={newAd.name} onChange={(e) => setNewAd({ ...newAd, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Slot</Label>
              <Select value={newAd.slot} onValueChange={(v) => setNewAd({ ...newAd, slot: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={newAd.type} onValueChange={(v) => setNewAd({ ...newAd, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {ads.map((ad) => (
          <AdRow key={ad.id} ad={ad} onChanged={() => router.refresh()} />
        ))}
      </div>
    </div>
  );
}

function AdRow({ ad, onChanged }: { ad: Ad; onChanged: () => void }) {
  const [state, setState] = useState(ad);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await updateAdAction(ad.id, {
      name: state.name,
      slot: state.slot,
      type: state.type,
      adsenseSlotId: state.adsenseSlotId ?? "",
      imageUrl: state.imageUrl ?? "",
      targetUrl: state.targetUrl ?? "",
      isActive: state.isActive,
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Saved");
      onChanged();
    } else toast.error(res.error);
  }

  async function remove() {
    if (!confirm("Delete this ad slot?")) return;
    const res = await deleteAdAction(ad.id);
    if (res.ok) {
      toast.success("Deleted");
      onChanged();
    } else toast.error(res.error);
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{state.name}</span>
            <Badge variant="outline">{state.slot}</Badge>
            <Badge variant="secondary">{state.type}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{ad.impressions} impressions</span>
            <span>{ad.clicks} clicks</span>
            <label className="flex items-center gap-2">
              Active
              <Switch checked={state.isActive} onCheckedChange={(v) => setState({ ...state, isActive: v })} />
            </label>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {state.type === "ADSENSE" && (
            <div className="space-y-1.5">
              <Label>AdSense slot ID</Label>
              <Input value={state.adsenseSlotId ?? ""} onChange={(e) => setState({ ...state, adsenseSlotId: e.target.value })} placeholder="1234567890" />
            </div>
          )}
          {state.type === "BANNER_IMAGE" && (
            <>
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input value={state.imageUrl ?? ""} onChange={(e) => setState({ ...state, imageUrl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Target URL</Label>
                <Input value={state.targetUrl ?? ""} onChange={(e) => setState({ ...state, targetUrl: e.target.value })} />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" className="text-destructive" onClick={remove}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button size="sm" onClick={save} disabled={busy}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
