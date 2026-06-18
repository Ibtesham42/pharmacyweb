import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DonationMethod, ResourceAccess, ResourceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { purchaseCreateSchema } from "@/lib/validation";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { createPurchase, attachRazorpayOrder } from "@/services/resource-purchases";
import { ensureBuyer } from "@/services/buyers";
import { isRazorpayConfigured, razorpayKeyId, createRazorpayOrder } from "@/lib/razorpay";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`resource-purchase:${ip}`, 10, 60_000).success) {
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

  const resource = await prisma.resource.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED, deletedAt: null },
    select: { id: true, title: true, access: true, pricePaise: true },
  });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  if (resource.access === ResourceAccess.FREE) {
    return NextResponse.json({ error: "This resource is free — just download it." }, { status: 400 });
  }
  if (resource.access === ResourceAccess.PREMIUM) {
    return NextResponse.json(
      { error: "This is a PREMIUM resource — get an all-access membership to download it." },
      { status: 403 },
    );
  }
  if (resource.pricePaise < 100) {
    return NextResponse.json({ error: "This resource is not available for purchase." }, { status: 400 });
  }

  if (d.method === DonationMethod.RAZORPAY && !isRazorpayConfigured()) {
    return NextResponse.json({ error: "Card payments are unavailable right now. Please use UPI." }, { status: 503 });
  }
  if (d.method === DonationMethod.UPI_MANUAL && (!settings.upiFallbackEnabled || !settings.upiId)) {
    return NextResponse.json({ error: "UPI is not available right now." }, { status: 503 });
  }

  const buyer = await ensureBuyer(d.email, d.name);
  const purchase = await createPurchase(
    {
      resourceId: resource.id,
      email: d.email,
      name: d.name,
      amountPaise: resource.pricePaise,
      method: d.method,
      buyerId: buyer.id,
    },
    ip,
  );

  if (d.method === DonationMethod.RAZORPAY) {
    try {
      const order = await createRazorpayOrder(resource.pricePaise, purchase.receiptNo);
      await attachRazorpayOrder(purchase.id, order.id);
      return NextResponse.json({
        purchaseId: purchase.id,
        receiptNo: purchase.receiptNo,
        razorpay: {
          orderId: order.id,
          keyId: razorpayKeyId(),
          amountPaise: resource.pricePaise,
          name: d.name,
          email: d.email,
          resourceTitle: resource.title,
        },
      });
    } catch (err) {
      console.error("razorpay order error", err);
      return NextResponse.json({ error: "Could not start the payment. Please try UPI." }, { status: 502 });
    }
  }

  const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    "PharmaCareers",
  )}&am=${(resource.pricePaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Resource " + purchase.receiptNo)}`;
  return NextResponse.json({
    purchaseId: purchase.id,
    receiptNo: purchase.receiptNo,
    upi: { upiId: settings.upiId, qrImageUrl: settings.qrImageUrl, amountPaise: resource.pricePaise, upiLink },
  });
}
