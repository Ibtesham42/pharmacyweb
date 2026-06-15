import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DonationMethod } from "@prisma/client";
import { donationCreateSchema } from "@/lib/validation";
import { getDonationSettings, createDonation, attachRazorpayOrder } from "@/services/donations";
import { isRazorpayConfigured, razorpayKeyId, createRazorpayOrder } from "@/lib/razorpay";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`donate:${ip}`, 10, 60_000).success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = donationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // honeypot — silently accept bots

  const settings = await getDonationSettings();
  if (!settings.enabled) {
    return NextResponse.json({ error: "Donations are currently disabled." }, { status: 503 });
  }
  if (d.amountPaise < settings.minAmountPaise) {
    return NextResponse.json(
      { error: `Minimum donation is ₹${Math.round(settings.minAmountPaise / 100)}.` },
      { status: 400 },
    );
  }
  if (d.method === DonationMethod.RAZORPAY && !isRazorpayConfigured()) {
    return NextResponse.json({ error: "Card payments are unavailable right now. Please use UPI." }, { status: 503 });
  }
  if (d.method === DonationMethod.UPI_MANUAL && !settings.upiId) {
    return NextResponse.json({ error: "UPI is not configured. Please try again later." }, { status: 503 });
  }

  const donation = await createDonation(
    {
      name: d.name,
      email: d.email,
      phone: d.phone || undefined,
      city: d.city || undefined,
      state: d.state || undefined,
      address: d.address || undefined,
      amountPaise: d.amountPaise,
      method: d.method,
      source: d.source || undefined,
      anonymous: d.anonymous,
      supporterConsent: d.supporterConsent,
      reason: d.reason || undefined,
      feedback: d.feedback || undefined,
    },
    ip,
  );

  if (d.method === DonationMethod.RAZORPAY) {
    try {
      const order = await createRazorpayOrder(d.amountPaise, donation.receiptNo);
      await attachRazorpayOrder(donation.id, order.id);
      return NextResponse.json({
        donationId: donation.id,
        receiptNo: donation.receiptNo,
        razorpay: {
          orderId: order.id,
          keyId: razorpayKeyId(),
          amountPaise: d.amountPaise,
          name: d.name,
          email: d.email,
        },
      });
    } catch (err) {
      console.error("razorpay order error", err);
      return NextResponse.json({ error: "Could not start the payment. Please try UPI." }, { status: 502 });
    }
  }

  const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    "PharmaCareers",
  )}&am=${(d.amountPaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Donation " + donation.receiptNo)}`;
  return NextResponse.json({
    donationId: donation.id,
    receiptNo: donation.receiptNo,
    upi: { upiId: settings.upiId, qrImageUrl: settings.qrImageUrl, amountPaise: d.amountPaise, upiLink },
  });
}
