"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DonationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setDonationStatusAction } from "@/app/admin/(panel)/donations/actions";
import { formatINR, formatDate } from "@/lib/format";

type Row = {
  id: string;
  receiptNo: string;
  name: string;
  email: string;
  amountPaise: number;
  method: string;
  status: DonationStatus;
  transactionRef: string | null;
  createdAt: Date;
};

export function DonationsTable({ donations }: { donations: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function update(id: string, status: DonationStatus) {
    setBusyId(id);
    const res = await setDonationStatusAction(id, status);
    setBusyId(null);
    if (res.ok) {
      toast.success("Updated");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (!donations.length) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No donations yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-2 font-medium">Receipt</th>
            <th className="p-2 font-medium">Donor</th>
            <th className="p-2 font-medium">Amount</th>
            <th className="p-2 font-medium">Method</th>
            <th className="p-2 font-medium">Status</th>
            <th className="p-2 font-medium">Ref</th>
            <th className="p-2 font-medium">Date</th>
            <th className="p-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((d) => (
            <tr key={d.id} className="border-t align-top">
              <td className="p-2 font-mono text-xs">{d.receiptNo}</td>
              <td className="p-2">
                {d.name}
                <br />
                <span className="text-xs text-muted-foreground">{d.email}</span>
              </td>
              <td className="p-2 font-medium">{formatINR(d.amountPaise)}</td>
              <td className="p-2">{d.method === "RAZORPAY" ? "Razorpay" : "UPI"}</td>
              <td className="p-2">
                <Badge variant={d.status === "PAID" ? "accent" : "secondary"}>{d.status}</Badge>
              </td>
              <td className="p-2 text-xs text-muted-foreground">{d.transactionRef || "—"}</td>
              <td className="p-2 text-xs text-muted-foreground">{formatDate(d.createdAt)}</td>
              <td className="p-2">
                <div className="flex gap-1">
                  {d.status !== DonationStatus.PAID && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === d.id}
                      onClick={() => update(d.id, DonationStatus.PAID)}
                    >
                      Mark paid
                    </Button>
                  )}
                  {d.status !== DonationStatus.FAILED && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === d.id}
                      onClick={() => update(d.id, DonationStatus.FAILED)}
                    >
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
