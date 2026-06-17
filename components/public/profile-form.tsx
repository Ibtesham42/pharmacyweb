"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { updateProfileAction, changePasswordAction } from "@/app/(public)/account/actions";

export function ProfileForm({ name: initialName, email }: { name: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingProfile, setSavingProfile] = useState(false);
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [cf, setCf] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Name is too short");
    setSavingProfile(true);
    const res = await updateProfileAction({ name, email });
    setSavingProfile(false);
    if (res.ok) {
      toast.success("Profile updated");
      router.refresh();
    } else toast.error(res.error);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (nw.length < 8) return toast.error("New password must be at least 8 characters");
    if (nw !== cf) return toast.error("Passwords do not match");
    setSavingPw(true);
    const res = await changePasswordAction({ currentPassword: cur, newPassword: nw, confirmPassword: cf });
    setSavingPw(false);
    if (res.ok) {
      toast.success("Password changed");
      setCur("");
      setNw("");
      setCf("");
    } else toast.error(res.error);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Profile</h3>
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled />
              <p className="text-xs text-muted-foreground">Your email is tied to your purchases and can&apos;t be changed here.</p>
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Change password</h3>
          <form onSubmit={savePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cur">Current password</Label>
              <Input id="cur" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nw">New password</Label>
              <Input id="nw" type="password" value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf">Confirm new password</Label>
              <Input id="cf" type="password" value={cf} onChange={(e) => setCf(e.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={savingPw} variant="outline">
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Update password
            </Button>
            <p className="text-xs text-muted-foreground">
              Signed in via email link only? Use “Forgot password” to set a password first.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
