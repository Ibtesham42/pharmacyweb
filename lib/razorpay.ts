// Server-only Razorpay helpers. Keys come from env and are NEVER sent to the
// client (only the publishable key id is exposed for Checkout). Uses the REST
// API + Node crypto — no SDK dependency.
import crypto from "node:crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export function isRazorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET);
}

/** Publishable key id — safe to send to the browser for Checkout. */
export function razorpayKeyId(): string | undefined {
  return KEY_ID;
}

export async function createRazorpayOrder(
  amountPaise: number,
  receiptNo: string,
): Promise<{ id: string }> {
  if (!KEY_ID || !KEY_SECRET) throw new Error("Razorpay is not configured");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: receiptNo,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Razorpay order failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Verify the Checkout callback signature: HMAC_SHA256(orderId|paymentId, keySecret). */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, signature);
}

/** Verify a webhook payload signature against the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, signature);
}
