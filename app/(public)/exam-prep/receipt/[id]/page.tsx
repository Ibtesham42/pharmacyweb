import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Package } from "lucide-react";
import { getBundlePurchaseForReceipt } from "@/services/bundle-purchases";
import { ReceiptActions } from "@/components/public/receipt-actions";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Bundle receipt",
  path: "/exam-prep/receipt",
  description: "Your PharmaCareers bundle purchase receipt.",
  noindex: true,
});

export default async function BundleReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getBundlePurchaseForReceipt(id);
  if (!p) notFound();

  const paid = p.status === "PAID";
  const txn = p.razorpayPaymentId || p.transactionRef || "—";

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
            {paid ? "Payment successful" : "Payment received — pending verification"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {paid
              ? "Your bundle is unlocked. Open it or your account to download every resource."
              : "Your UPI payment is awaiting admin verification. The bundle unlocks once confirmed."}
          </p>
        </div>

        <div className="mt-6 rounded-xl border bg-muted/30 p-5">
          <div className="flex items-center justify-between border-b pb-2 text-sm font-semibold">
            <span>{siteConfig.name} — Receipt</span>
            <span className="font-mono text-xs">{p.receiptNo}</span>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Bundle" value={p.bundle.title} />
            <Row label="Buyer" value={p.name || "—"} />
            <Row label="Amount" value={formatINR(p.amountPaise)} />
            <Row label="Transaction ID" value={txn} />
            <Row label="Method" value={p.method === "RAZORPAY" ? "Razorpay" : "UPI"} />
            <Row label="Status" value={paid ? "Paid" : "Pending verification"} />
            <Row label="Date" value={formatDate(p.paidAt ?? p.createdAt)} />
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2 print:hidden">
          {paid && (
            <Button asChild>
              <Link href={`/exam-prep/${p.bundle.slug}`}>
                <Package className="h-4 w-4" /> Open bundle
              </Link>
            </Button>
          )}
          <ReceiptActions />
          <Button asChild variant="ghost">
            <Link href="/account">My account</Link>
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
