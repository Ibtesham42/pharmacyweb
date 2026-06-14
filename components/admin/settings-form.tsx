"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateHomepageAction, updateContactAction } from "@/app/admin/(panel)/settings/actions";

export function SettingsForm({
  homepage,
  contact,
}: {
  homepage: { heroTitle: string; heroSubtitle: string; featuredCount: number };
  contact: { email: string; phone: string; address: string };
}) {
  const router = useRouter();
  const [hp, setHp] = useState(homepage);
  const [ct, setCt] = useState(contact);
  const [busy, setBusy] = useState(false);

  async function saveHomepage(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await updateHomepageAction(hp);
    setBusy(false);
    if (res.ok) {
      toast.success("Homepage saved");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await updateContactAction(ct);
    setBusy(false);
    if (res.ok) {
      toast.success("Contact saved");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Homepage</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveHomepage} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Hero title</Label>
              <Input value={hp.heroTitle} onChange={(e) => setHp({ ...hp, heroTitle: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Hero subtitle</Label>
              <Textarea value={hp.heroSubtitle} onChange={(e) => setHp({ ...hp, heroSubtitle: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Featured count</Label>
              <Input type="number" min={1} max={12} value={hp.featuredCount} onChange={(e) => setHp({ ...hp, featuredCount: Number(e.target.value) })} />
            </div>
            <Button type="submit" disabled={busy}>Save homepage</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Contact details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveContact} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={ct.email} onChange={(e) => setCt({ ...ct, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={ct.phone} onChange={(e) => setCt({ ...ct, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={ct.address} onChange={(e) => setCt({ ...ct, address: e.target.value })} />
            </div>
            <Button type="submit" disabled={busy}>Save contact</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
