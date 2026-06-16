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

  await markPaid(purchase.id, razorpayPaymentId);
  // Fire-and-forget receipt email (never blocks the unlock).
  void sendResourceReceiptEmail(purchase.id);

  return NextResponse.json({ receiptUrl: `/store/receipt/${purchase.id}` });
}
