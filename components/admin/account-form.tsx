"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateProfileAction, changePasswordAction } from "@/app/admin/(panel)/account/actions";

export function AccountForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState({ name, email });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busyP, setBusyP] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusyP(true);
    const res = await updateProfileAction(profile);
    setBusyP(false);
    if (res.ok) {
      toast.success("Profile updated. Use your new email next time you sign in.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusyPw(true);
    const res = await changePasswordAction(pw);
    setBusyPw(false);
    if (res.ok) {
      toast.success("Password changed");
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile &amp; login email</CardTitle>
          <CardDescription>Change your display name and the email you sign in with.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Login email (ID)</Label>
              <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
            </div>
            <Button type="submit" disabled={busyP}>{busyP ? "Saving…" : "Save profile"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
          <CardDescription>Enter your current password to set a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input id="confirm" type="password" autoComplete="new-password" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} required minLength={8} />
            </div>
            <Button type="submit" disabled={busyPw}>{busyPw ? "Changing…" : "Change password"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
