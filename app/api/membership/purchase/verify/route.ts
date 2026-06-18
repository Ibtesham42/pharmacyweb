import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { purchaseVerifySchema } from "@/lib/validation";
import { getMembershipPurchaseById, markPaid, sendMembershipReceiptEmail } from "@/services/membership-purchases";
import { verifyPaymentSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = purchaseVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { purchaseId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const purchase = await getMembershipPurchaseById(purchaseId);
  if (!purchase || !purchase.razorpayOrderId) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }
  const ok = verifyPaymentSignature(purchase.razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!ok) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // Grant + email/notify only on the FIRST PAID transition (verify + webhook are idempotent).
  if (await markPaid(purchase.id, razorpayPaymentId)) {
    void sendMembershipReceiptEmail(purchase.id);
  }

  return NextResponse.json({ receiptUrl: `/membership/receipt/${purchase.id}` });
}
