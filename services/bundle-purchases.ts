import crypto from "node:crypto";
import { Prisma, DonationMethod, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { absoluteUrl } from "@/lib/site";
import { formatINR } from "@/lib/format";

function genReceiptNo(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `BND-${ym}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export interface CreateBundlePurchaseInput {
  bundleId: string;
  email: string;
  name?: string;
  amountPaise: number;
  method: DonationMethod;
  buyerId?: string | null;
}

export async function createBundlePurchase(input: CreateBundlePurchaseInput, ip?: string) {
  return prisma.bundlePurchase.create({
    data: {
      receiptNo: genReceiptNo(),
      bundleId: input.bundleId,
      buyerId: input.buyerId || null,
      email: input.email.toLowerCase(),
      name: input.name || null,
      amountPaise: input.amountPaise,
      method: input.method,
      ip: ip || null,
    },
  });
}

export async function attachRazorpayOrder(id: string, orderId: string) {
  await prisma.bundlePurchase.update({ where: { id }, data: { razorpayOrderId: orderId } });
}

/** Idempotent: only moves a non-PAID purchase to PAID. */
export async function markPaid(id: string, razorpayPaymentId?: string) {
  await prisma.bundlePurchase.updateMany({
    where: { id, status: { not: OrderStatus.PAID } },
    data: { status: OrderStatus.PAID, paidAt: new Date(), ...(razorpayPaymentId ? { razorpayPaymentId } : {}) },
  });
}

export async function markPaidByOrderId(orderId: string, razorpayPaymentId?: string) {
  await prisma.bundlePurchase.updateMany({
    where: { razorpayOrderId: orderId, status: { not: OrderStatus.PAID } },
    data: { status: OrderStatus.PAID, paidAt: new Date(), ...(razorpayPaymentId ? { razorpayPaymentId } : {}) },
  });
}

export async function submitManualRef(id: string, transactionRef: string) {
  await prisma.bundlePurchase.update({ where: { id }, data: { transactionRef } });
}

export function getBundlePurchaseById(id: string) {
  return prisma.bundlePurchase.findUnique({ where: { id } });
}

export function getBundlePurchaseByRazorpayOrderId(orderId: string) {
  return prisma.bundlePurchase.findFirst({ where: { razorpayOrderId: orderId } });
}

/** Receipt-safe view (no IP / payment internals beyond the reference). */
export async function getBundlePurchaseForReceipt(id: string) {
  return prisma.bundlePurchase.findUnique({
    where: { id },
    select: {
      id: true,
      receiptNo: true,
      name: true,
      amountPaise: true,
      currency: true,
      method: true,
      status: true,
      transactionRef: true,
      razorpayPaymentId: true,
      createdAt: true,
      paidAt: true,
      bundle: { select: { title: true, slug: true } },
    },
  });
}

/** Email a receipt once a bundle purchase is PAID. */
export async function sendBundleReceiptEmail(purchaseId: string) {
  const p = await prisma.bundlePurchase.findUnique({
    where: { id: purchaseId },
    select: {
      id: true,
      receiptNo: true,
      email: true,
      amountPaise: true,
      bundle: { select: { title: true, slug: true } },
    },
  });
  if (!p) return;
  const bundleUrl = absoluteUrl(`/exam-prep/${p.bundle.slug}`);
  const receiptUrl = absoluteUrl(`/exam-prep/receipt/${p.id}`);
  await sendEmail({
    to: p.email,
    subject: `Your PharmaCareers receipt — ${p.bundle.title}`,
    text: `Thank you for your purchase!\n\nBundle: ${p.bundle.title}\nAmount: ${formatINR(p.amountPaise)}\nReceipt: ${p.receiptNo}\n\nOpen the bundle: ${bundleUrl}\nReceipt page: ${receiptUrl}\n\nSign in at ${absoluteUrl("/account")} with this email to download everything in the bundle anytime.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
      <h2>Thank you for your purchase!</h2>
      <p><strong>${p.bundle.title}</strong></p>
      <p>Amount: <strong>${formatINR(p.amountPaise)}</strong><br/>Receipt: ${p.receiptNo}</p>
      <p><a href="${bundleUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open your bundle</a></p>
      <p style="font-size:13px;color:#666">Or <a href="${receiptUrl}">view your receipt</a>. Sign in at <a href="${absoluteUrl("/account")}">your account</a> with this email to download anytime.</p>
    </div>`,
  });
}

export async function adminSetBundlePurchaseStatus(id: string, status: OrderStatus) {
  return prisma.bundlePurchase.update({
    where: { id },
    data: { status, ...(status === OrderStatus.PAID ? { paidAt: new Date() } : {}) },
  });
}

export async function listBundlePurchases(opts: { status?: OrderStatus; q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const where: Prisma.BundlePurchaseWhereInput = {
    ...(opts.status && { status: opts.status }),
    ...(opts.q && {
      OR: [
        { name: { contains: opts.q, mode: "insensitive" } },
        { email: { contains: opts.q, mode: "insensitive" } },
        { receiptNo: { contains: opts.q, mode: "insensitive" } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.bundlePurchase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        receiptNo: true,
        name: true,
        email: true,
        amountPaise: true,
        method: true,
        status: true,
        transactionRef: true,
        createdAt: true,
        bundle: { select: { title: true } },
      },
    }),
    prisma.bundlePurchase.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Whether this buyer (by id or email) owns a PAID purchase of this bundle. */
export async function hasBundlePurchase(
  bundleId: string,
  buyerId?: string | null,
  email?: string | null,
): Promise<boolean> {
  const ors: Prisma.BundlePurchaseWhereInput[] = [];
  if (buyerId) ors.push({ buyerId });
  if (email) ors.push({ email: email.toLowerCase() });
  if (!ors.length) return false;
  const row = await prisma.bundlePurchase.findFirst({
    where: { bundleId, status: OrderStatus.PAID, OR: ors },
    select: { id: true },
  });
  return Boolean(row);
}

/** Bundle purchases visible in a buyer's dashboard. */
export async function listBuyerBundlePurchases(buyerId: string, email: string) {
  return prisma.bundlePurchase.findMany({
    where: { status: OrderStatus.PAID, OR: [{ buyerId }, { email: email.toLowerCase() }] },
    orderBy: { paidAt: "desc" },
    select: {
      id: true,
      receiptNo: true,
      amountPaise: true,
      paidAt: true,
      bundle: { select: { title: true, slug: true, _count: { select: { items: true } } } },
    },
  });
}
