"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { OrderStatus, MembershipStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  setMembershipPurchaseStatusAction,
  approveMembershipAction,
  rejectMembershipAction,
  suspendMembershipAction,
  extendMembershipAction,
} from "@/app/admin/(panel)/resources/memberships/actions";
import { formatINR, formatDate } from "@/lib/format";
import { MEMBERSHIP_STATUS_LABELS, MEMBERSHIP_STATUS_VARIANT } from "@/lib/marketplace/config";

type Row = {
  id: string;
  receiptNo: string;
  name: string | null;
  email: string;
  amountPaise: number;
  method: string;
  status: OrderStatus;
  membershipStatus: MembershipStatus;
  transactionRef: string | null;
  razorpayPaymentId: string | null;
  createdAt: Date;
  paidAt: Date | null;
  plan: { name: string };
  buyer: { userId: string | null } | null;
};

export function MembershipPurchasesTable({ purchases }: { purchases: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [days, setDays] = useState<Record<string, string>>({});

  async function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    setBusyId(id);
    try {
      const res = await fn();
      if (res.ok) {
        toast.success(okMsg);
        router.refresh();
      } else toast.error(res.error || "Failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!purchases.length) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No membership purchases yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-2 font-medium">Buyer</th>
            <th className="p-2 font-medium">Plan</th>
            <th className="p-2 font-medium">Amount</th>
            <th className="p-2 font-medium">Txn ID</th>
            <th className="p-2 font-medium">Method</th>
            <th className="p-2 font-medium">Payment</th>
            <th className="p-2 font-medium">Verification</th>
            <th className="p-2 font-medium">Purchased</th>
            <th className="p-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((p) => {
            const busy = busyId === p.id;
            const txn = p.razorpayPaymentId || p.transactionRef || "—";
            const paid = p.status === OrderStatus.PAID;
            return (
              <tr key={p.id} className="border-t align-top">
                <td className="p-2">
                  <div className="font-medium">{p.name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{p.email}</div>
                  <div className="text-xs text-muted-foreground">User ID: {p.buyer?.userId ?? "—"}</div>
                </td>
                <td className="p-2">{p.plan.name}</td>
                <td className="p-2 font-medium">{formatINR(p.amountPaise)}</td>
                <td className="p-2 font-mono text-xs">{txn}</td>
                <td className="p-2">{p.method === "RAZORPAY" ? "Razorpay" : "UPI"}</td>
                <td className="p-2">
                  <Badge variant={paid ? "success" : p.status === "FAILED" ? "secondary" : "warning"}>{p.status}</Badge>
                </td>
                <td className="p-2">
                  <Badge variant={MEMBERSHIP_STATUS_VARIANT[p.membershipStatus]}>
                    {MEMBERSHIP_STATUS_LABELS[p.membershipStatus]}
                  </Badge>
                </td>
                <td className="p-2 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
                <td className="p-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap gap-1">
                      {!paid && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => run(p.id, () => setMembershipPurchaseStatusAction(p.id, OrderStatus.PAID), "Marked paid")}
                        >
                          Mark paid
                        </Button>
                      )}
                      {paid && p.membershipStatus !== "APPROVED" && (
                        <Button size="sm" disabled={busy} onClick={() => run(p.id, () => approveMembershipAction(p.id), "Approved — PREMIUM active")}>
                          Approve
                        </Button>
                      )}
                      {p.membershipStatus === "APPROVED" && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => run(p.id, () => suspendMembershipAction(p.id), "Suspended")}>
                          Suspend
                        </Button>
                      )}
                      {p.membershipStatus !== "REJECTED" && p.membershipStatus !== "APPROVED" && (
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(p.id, () => rejectMembershipAction(p.id), "Rejected")}>
                          Reject
                        </Button>
                      )}
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/membership/receipt/${p.id}`} target="_blank">
                          Payment details
                        </Link>
                      </Button>
                    </div>
                    {paid && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          value={days[p.id] ?? "30"}
                          onChange={(e) => setDays((s) => ({ ...s, [p.id]: e.target.value }))}
                          className="h-8 w-16"
                          aria-label="Days to extend"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => run(p.id, () => extendMembershipAction(p.id, Number(days[p.id] ?? "30")), "Extended")}
                        >
                          Extend
                        </Button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
