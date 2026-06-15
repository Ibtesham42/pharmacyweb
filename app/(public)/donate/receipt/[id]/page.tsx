import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { getDonationForReceipt, getDonationSettings } from "@/services/donations";
import { ReceiptActions } from "@/components/public/receipt-actions";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { DEFAULT_DONATION_SETTINGS } from "@/lib/donations/config";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDonationForReceipt(id);
  if (!d) notFound();

  const settings = await safe(getDonationSettings(), DEFAULT_DONATION_SETTINGS);
  const paid = d.status === "PAID";
  const txn = d.razorpayPaymentId || d.transactionRef || "—";

  return (
    <div className="container max-w-xl py-10">
      <div className="rounded-2xl border p-6 sm:p-8">
        <div className="text-center">
          {paid ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          ) : (
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          )}
          <h1 className="mt-3 text-2xl font-bold">
            {paid ? "Thank you for supporting our mission." : "Donation received — pending verification"}
          </h1>
          {paid && settings.thankYouMessage && (
            <p className="mt-1 text-sm text-muted-foreground">{settings.thankYouMessage}</p>
          )}
        </div>

        <div className="mt-6 rounded-xl border bg-muted/30 p-5">
          <div className="flex items-center justify-between border-b pb-2 text-sm font-semibold">
            <span>{siteConfig.name} — Donation receipt</span>
            <span className="font-mono text-xs">{d.receiptNo}</span>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Donor" value={d.anonymous ? "Anonymous" : d.name} />
            <Row label="Amount" value={formatINR(d.amountPaise)} />
            <Row label="Transaction ID" value={txn} />
            <Row label="Method" value={d.method === "RAZORPAY" ? "Razorpay" : "UPI"} />
            <Row label="Status" value={paid ? "Paid" : "Pending verification"} />
            <Row label="Date" value={formatDate(d.paidAt ?? d.createdAt)} />
          </dl>
        </div>

        {paid && (
          <div className="mt-4 text-center">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              ❤ Community Supporter
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2 print:hidden">
          <ReceiptActions />
          <Button asChild variant="ghost">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
