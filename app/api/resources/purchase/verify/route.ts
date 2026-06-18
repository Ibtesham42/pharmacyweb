import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { purchaseVerifySchema } from "@/lib/validation";
import { getPurchaseById, markPaid, sendResourceReceiptEmail } from "@/services/resource-purchases";
import { verifyPaymentSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = purchaseVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { purchaseId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const purchase = await getPurchaseById(purchaseId);
  if (!purchase || !purchase.razorpayOrderId) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }
  const ok = verifyPaymentSignature(purchase.razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!ok) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // Only email/notify on the FIRST PAID transition (verify + webhook are both
  // idempotent — whichever lands first sends exactly one receipt).
  if (await markPaid(purchase.id, razorpayPaymentId)) {
    void sendResourceReceiptEmail(purchase.id); // fire-and-forget; never blocks unlock
  }

  return NextResponse.json({ receiptUrl: `/store/receipt/${purchase.id}` });
}
