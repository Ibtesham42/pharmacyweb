import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { verifyWebhookSignature } from "@/lib/razorpay";
import {
  getPurchaseByRazorpayOrderId,
  markPaid,
  sendResourceReceiptEmail,
} from "@/services/resource-purchases";

export const dynamic = "force-dynamic";

// Separate webhook from donations so existing donation handling is untouched.
// Register this URL (/api/razorpay/resource-webhook) in the Razorpay dashboard.
type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string } };
    order?: { entity?: { id?: string } };
  };
};

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhook;
  try {
    event = JSON.parse(raw) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;
    if (orderId) {
      const purchase = await getPurchaseByRazorpayOrderId(orderId);
      // Only act once; the /verify route usually marks PAID first (instant unlock).
      if (purchase && purchase.status !== OrderStatus.PAID) {
        await markPaid(purchase.id, payment?.id);
        void sendResourceReceiptEmail(purchase.id);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
