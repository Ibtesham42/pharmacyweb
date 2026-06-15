import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { donationVerifySchema } from "@/lib/validation";
import { getDonationById, markPaid } from "@/services/donations";
import { verifyPaymentSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = donationVerifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { donationId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const donation = await getDonationById(donationId);
  if (!donation || !donation.razorpayOrderId) {
    return NextResponse.json({ error: "Donation not found." }, { status: 404 });
  }
  if (!verifyPaymentSignature(donation.razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }
  await markPaid(donationId, razorpayPaymentId);
  return NextResponse.json({ ok: true, receiptUrl: `/donate/receipt/${donationId}` });
}
