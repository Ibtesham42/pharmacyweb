import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DonationMethod } from "@prisma/client";
import { purchaseCreateSchema } from "@/lib/validation";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { getPlanById } from "@/services/memberships";
import { createMembershipPurchase, attachRazorpayOrder } from "@/services/membership-purchases";
import { ensureBuyer } from "@/services/buyers";
import { isRazorpayConfigured, razorpayKeyId, createRazorpayOrder } from "@/lib/razorpay";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`membership-purchase:${ip}`, 10, 60_000).success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const { planId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = purchaseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // honeypot

  const settings = await getMarketplaceSettings();
  if (!settings.enabled) {
    return NextResponse.json({ error: "The store is currently unavailable." }, { status: 503 });
  }

  const plan = await getPlanById(planId);
  if (!plan || !plan.active) return NextResponse.json({ error: "Plan not available" }, { status: 404 });
  if (plan.pricePaise < 100) {
    return NextResponse.json({ error: "This plan is not available for purchase." }, { status: 400 });
  }

  if (d.method === DonationMethod.RAZORPAY && !isRazorpayConfigured()) {
    return NextResponse.json({ error: "Card payments are unavailable right now. Please use UPI." }, { status: 503 });
  }
  if (d.method === DonationMethod.UPI_MANUAL && (!settings.upiFallbackEnabled || !settings.upiId)) {
    return NextResponse.json({ error: "UPI is not available right now." }, { status: 503 });
  }

  const buyer = await ensureBuyer(d.email, d.name);
  const purchase = await createMembershipPurchase(
    { planId: plan.id, email: d.email, name: d.name, amountPaise: plan.pricePaise, method: d.method, buyerId: buyer.id },
    ip,
  );

  if (d.method === DonationMethod.RAZORPAY) {
    try {
      const order = await createRazorpayOrder(plan.pricePaise, purchase.receiptNo);
      await attachRazorpayOrder(purchase.id, order.id);
      return NextResponse.json({
        purchaseId: purchase.id,
        receiptNo: purchase.receiptNo,
        razorpay: {
          orderId: order.id,
          keyId: razorpayKeyId(),
          amountPaise: plan.pricePaise,
          name: d.name,
          email: d.email,
          resourceTitle: `PREMIUM — ${plan.name}`,
        },
      });
    } catch (err) {
      console.error("razorpay membership order error", err);
      return NextResponse.json({ error: "Could not start the payment. Please try UPI." }, { status: 502 });
    }
  }

  const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    "PharmaCareers",
  )}&am=${(plan.pricePaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent("PREMIUM " + purchase.receiptNo)}`;
  return NextResponse.json({
    purchaseId: purchase.id,
    receiptNo: purchase.receiptNo,
    upi: { upiId: settings.upiId, qrImageUrl: settings.qrImageUrl, amountPaise: plan.pricePaise, upiLink },
  });
}
