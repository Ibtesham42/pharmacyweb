"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import { durationLabel } from "@/lib/marketplace/config";
import { createPlanAction, updatePlanAction, deletePlanAction } from "@/app/admin/(panel)/resources/memberships/actions";

export interface PlanRow {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  pricePaise: number;
  badge: string | null;
  active: boolean;
  sortOrder: number;
}

type Draft = {
  name: string;
  description: string;
  durationDays: string;
  priceRupees: string;
  badge: string;
  active: boolean;
  sortOrder: string;
};

const emptyDraft: Draft = { name: "", description: "", durationDays: "30", priceRupees: "", badge: "", active: true, sortOrder: "0" };

export function MembershipPlansManager({ plans }: { plans: PlanRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null); // plan id, or "new", or null
  const [d, setD] = useState<Draft>(emptyDraft);
  const [busy, setBusy] = useState(false);

  function startNew() {
    setD(emptyDraft);
    setEditing("new");
  }
  function startEdit(p: PlanRow) {
    setD({
      name: p.name,
      description: p.description ?? "",
      durationDays: String(p.durationDays),
      priceRupees: String(Math.round(p.pricePaise / 100)),
      badge: p.badge ?? "",
      active: p.active,
      sortOrder: String(p.sortOrder),
    });
    setEditing(p.id);
  }
  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    if (d.name.trim().length < 2) return toast.error("Name is required");
    if (Number(d.durationDays) < 1) return toast.error("Duration must be at least 1 day");
    if (Number(d.priceRupees || 0) < 1) return toast.error("Set a price");
    setBusy(true);
    const payload = {
      name: d.name,
      description: d.description,
      durationDays: Number(d.durationDays),
      pricePaise: Math.round(Number(d.priceRupees) * 100),
      badge: d.badge,
      active: d.active,
      sortOrder: Number(d.sortOrder || 0),
    };
    const res = editing === "new" ? await createPlanAction(payload) : await updatePlanAction(editing!, payload);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Saved");
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this plan? Existing members keep their access.")) return;
    const res = await deletePlanAction(id);
    if (res.ok) {
      toast.success("Deleted");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Membership plans</h2>
        {editing === null && (
          <Button size="sm" onClick={startNew}>
            <Plus className="h-4 w-4" /> New plan
          </Button>
        )}
      </div>

      {editing !== null && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{editing === "new" ? "New plan" : "Edit plan"}</p>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <Input value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 3-month PREMIUM" />
              </Field>
              <Field label="Badge (optional)">
                <Input value={d.badge} onChange={(e) => set("badge", e.target.value)} placeholder="e.g. Most popular" />
              </Field>
              <Field label="Duration (days)">
                <Input type="number" min={1} value={d.durationDays} onChange={(e) => set("durationDays", e.target.value)} />
              </Field>
              <Field label="Price (₹)">
                <Input type="number" min={1} value={d.priceRupees} onChange={(e) => set("priceRupees", e.target.value)} />
              </Field>
              <Field label="Sort order">
                <Input type="number" min={0} value={d.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
              </Field>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={d.active} onCheckedChange={(v) => set("active", v)} /> Active (shown publicly)
                </label>
              </div>
            </div>
            <Field label="Description (optional)">
              <Input value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={300} />
            </Field>
            <div className="flex gap-2">
              <Button onClick={save} disabled={busy}>Save plan</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {plans.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No plans yet. Create one to open PREMIUM memberships.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2 font-medium">Plan</th>
                <th className="p-2 font-medium">Duration</th>
                <th className="p-2 font-medium">Price</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    {p.name}
                    {p.badge && <Badge variant="accent" className="ml-2">{p.badge}</Badge>}
                  </td>
                  <td className="p-2 text-muted-foreground">{durationLabel(p.durationDays)}</td>
                  <td className="p-2 font-medium">{formatINR(p.pricePaise)}</td>
                  <td className="p-2">
                    <Badge variant={p.active ? "success" : "secondary"}>{p.active ? "Active" : "Hidden"}</Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(p.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
