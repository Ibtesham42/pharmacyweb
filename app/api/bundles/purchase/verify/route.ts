import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { purchaseVerifySchema } from "@/lib/validation";
import { getBundlePurchaseById, markPaid, sendBundleReceiptEmail } from "@/services/bundle-purchases";
import { verifyPaymentSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = purchaseVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { purchaseId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const purchase = await getBundlePurchaseById(purchaseId);
  if (!purchase || !purchase.razorpayOrderId) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }
  const ok = verifyPaymentSignature(purchase.razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!ok) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  await markPaid(purchase.id, razorpayPaymentId);
  void sendBundleReceiptEmail(purchase.id);

  return NextResponse.json({ receiptUrl: `/exam-prep/receipt/${purchase.id}` });
}
