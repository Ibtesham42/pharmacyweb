"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setBundlePurchaseStatusAction } from "@/app/admin/(panel)/resources/bundles/actions";
import { formatINR, formatDate } from "@/lib/format";

type Row = {
  id: string;
  receiptNo: string;
  name: string | null;
  email: string;
  amountPaise: number;
  method: string;
  status: OrderStatus;
  transactionRef: string | null;
  createdAt: Date;
  bundle: { title: string };
};

export function BundlePurchasesTable({ purchases }: { purchases: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function update(id: string, status: OrderStatus) {
    setBusyId(id);
    const res = await setBundlePurchaseStatusAction(id, status);
    setBusyId(null);
    if (res.ok) {
      toast.success("Updated");
      router.refresh();
    } else toast.error(res.error);
  }

  if (!purchases.length) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No bundle purchases yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-2 font-medium">Receipt</th>
            <th className="p-2 font-medium">Bundle</th>
            <th className="p-2 font-medium">Buyer</th>
            <th className="p-2 font-medium">Amount</th>
            <th className="p-2 font-medium">Method</th>
            <th className="p-2 font-medium">Status</th>
            <th className="p-2 font-medium">Date</th>
            <th className="p-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((p) => (
            <tr key={p.id} className="border-t align-top">
              <td className="p-2 font-mono text-xs">{p.receiptNo}</td>
              <td className="p-2">{p.bundle.title}</td>
              <td className="p-2">
                {p.name || "—"}
                <br />
                <span className="text-xs text-muted-foreground">{p.email}</span>
                {p.transactionRef && (
                  <>
                    <br />
                    <span className="text-xs text-muted-foreground">UTR: {p.transactionRef}</span>
                  </>
                )}
              </td>
              <td className="p-2 font-medium">{formatINR(p.amountPaise)}</td>
              <td className="p-2">{p.method === "RAZORPAY" ? "Razorpay" : "UPI"}</td>
              <td className="p-2">
                <Badge variant={p.status === "PAID" ? "success" : p.status === "FAILED" ? "secondary" : "warning"}>
                  {p.status}
                </Badge>
              </td>
              <td className="p-2 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
              <td className="p-2">
                <div className="flex gap-1">
                  {p.status !== OrderStatus.PAID && (
                    <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => update(p.id, OrderStatus.PAID)}>
                      Mark paid
                    </Button>
                  )}
                  {p.status !== OrderStatus.FAILED && (
                    <Button size="sm" variant="ghost" disabled={busyId === p.id} onClick={() => update(p.id, OrderStatus.FAILED)}>
                      Reject
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
