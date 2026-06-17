import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DonationMethod, ResourceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { purchaseCreateSchema } from "@/lib/validation";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { createBundlePurchase, attachRazorpayOrder } from "@/services/bundle-purchases";
import { ensureBuyer } from "@/services/buyers";
import { isRazorpayConfigured, razorpayKeyId, createRazorpayOrder } from "@/lib/razorpay";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`bundle-purchase:${ip}`, 10, 60_000).success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const { slug } = await params;
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

  const bundle = await prisma.bundle.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED, deletedAt: null },
    select: { id: true, title: true, pricePaise: true },
  });
  if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  if (bundle.pricePaise < 100) {
    return NextResponse.json({ error: "This bundle is not available for purchase." }, { status: 400 });
  }

  if (d.method === DonationMethod.RAZORPAY && !isRazorpayConfigured()) {
    return NextResponse.json({ error: "Card payments are unavailable right now. Please use UPI." }, { status: 503 });
  }
  if (d.method === DonationMethod.UPI_MANUAL && (!settings.upiFallbackEnabled || !settings.upiId)) {
    return NextResponse.json({ error: "UPI is not available right now." }, { status: 503 });
  }

  const buyer = await ensureBuyer(d.email, d.name);
  const purchase = await createBundlePurchase(
    { bundleId: bundle.id, email: d.email, name: d.name, amountPaise: bundle.pricePaise, method: d.method, buyerId: buyer.id },
    ip,
  );

  if (d.method === DonationMethod.RAZORPAY) {
    try {
      const order = await createRazorpayOrder(bundle.pricePaise, purchase.receiptNo);
      await attachRazorpayOrder(purchase.id, order.id);
      return NextResponse.json({
        purchaseId: purchase.id,
        receiptNo: purchase.receiptNo,
        razorpay: {
          orderId: order.id,
          keyId: razorpayKeyId(),
          amountPaise: bundle.pricePaise,
          name: d.name,
          email: d.email,
          resourceTitle: bundle.title,
        },
      });
    } catch (err) {
      console.error("razorpay bundle order error", err);
      return NextResponse.json({ error: "Could not start the payment. Please try UPI." }, { status: 502 });
    }
  }

  const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    "PharmaCareers",
  )}&am=${(bundle.pricePaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Bundle " + purchase.receiptNo)}`;
  return NextResponse.json({
    purchaseId: purchase.id,
    receiptNo: purchase.receiptNo,
    upi: { upiId: settings.upiId, qrImageUrl: settings.qrImageUrl, amountPaise: bundle.pricePaise, upiLink },
  });
}
