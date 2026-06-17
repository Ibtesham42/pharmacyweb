"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setUserStatusAction, grantPremiumAction, revokePremiumAction } from "@/app/admin/(panel)/users/actions";

export function UserAdminActions({
  id,
  status,
  isAdmin,
  isSelf,
  isMember,
}: {
  id: string;
  status: UserStatus;
  isAdmin: boolean;
  isSelf: boolean;
  isMember: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState("30");

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    setBusy(true);
    try {
      const res = await fn();
      if (res.ok) {
        toast.success(okMsg);
        router.refresh();
      } else toast.error(res.error || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Access</h3>
        {isAdmin ? (
          <p className="text-sm text-muted-foreground">Admin accounts can’t be suspended.</p>
        ) : isSelf ? (
          <p className="text-sm text-muted-foreground">You can’t change your own status.</p>
        ) : status === "ACTIVE" ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={busy}
            onClick={() => run(() => setUserStatusAction(id, UserStatus.SUSPENDED), "User suspended")}
          >
            Suspend user
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => run(() => setUserStatusAction(id, UserStatus.ACTIVE), "User reactivated")}
          >
            Reactivate user
          </Button>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-2 text-sm font-semibold">PREMIUM membership</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="days" className="text-xs">
              Duration (days)
            </Label>
            <Input
              id="days"
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="h-9 w-28"
            />
          </div>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => run(() => grantPremiumAction(id, Number(days)), "PREMIUM granted")}
          >
            {isMember ? "Extend PREMIUM" : "Grant PREMIUM"}
          </Button>
          {isMember && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => run(() => revokePremiumAction(id), "PREMIUM revoked")}
            >
              Revoke
            </Button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Complimentary grant — extends from any current expiry.</p>
      </div>
    </div>
  );
}
