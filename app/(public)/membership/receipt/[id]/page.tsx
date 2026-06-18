import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Crown } from "lucide-react";
import { getMembershipPurchaseForReceipt } from "@/services/membership-purchases";
import { ReceiptActions } from "@/components/public/receipt-actions";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { durationLabel } from "@/lib/marketplace/config";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Membership receipt",
  path: "/membership/receipt",
  description: "Your PharmaCareers PREMIUM membership receipt.",
  noindex: true,
});

export default async function MembershipReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getMembershipPurchaseForReceipt(id);
  if (!p) notFound();

  const paid = p.status === "PAID";
  const approved = p.membershipStatus === "APPROVED";
  const txn = p.razorpayPaymentId || p.transactionRef || "—";
  const statusValue = approved
    ? "Active (approved)"
    : paid
      ? "Paid — pending verification"
      : "Pending verification";

  return (
    <div className="container max-w-xl py-10">
      <div className="rounded-2xl border p-6 sm:p-8">
        <div className="text-center">
          {approved ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          ) : (
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          )}
          <h1 className="mt-3 text-2xl font-bold">
            {approved ? "Welcome to PREMIUM" : "Payment received — pending verification"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {approved
              ? "Your membership is active. Download any resource from your account."
              : paid
                ? "Your payment is confirmed and awaiting admin verification. PREMIUM activates once an admin approves it — we’ll notify you."
                : "Your UPI payment is awaiting admin verification. PREMIUM activates once confirmed and approved."}
          </p>
        </div>

        <div className="mt-6 rounded-xl border bg-muted/30 p-5">
          <div className="flex items-center justify-between border-b pb-2 text-sm font-semibold">
            <span>{siteConfig.name} — Receipt</span>
            <span className="font-mono text-xs">{p.receiptNo}</span>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Plan" value={`${p.plan.name} (${durationLabel(p.plan.durationDays)})`} />
            <Row label="Buyer" value={p.name || "—"} />
            <Row label="Amount" value={formatINR(p.amountPaise)} />
            <Row label="Transaction ID" value={txn} />
            <Row label="Method" value={p.method === "RAZORPAY" ? "Razorpay" : "UPI"} />
            <Row label="Payment" value={paid ? "Paid" : "Pending"} />
            <Row label="Membership" value={statusValue} />
            <Row label="Date" value={formatDate(p.paidAt ?? p.createdAt)} />
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2 print:hidden">
          <Button asChild>
            <Link href="/account">
              <Crown className="h-4 w-4" /> My account
            </Link>
          </Button>
          <ReceiptActions />
          <Button asChild variant="ghost">
            <Link href="/store">Browse resources</Link>
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
