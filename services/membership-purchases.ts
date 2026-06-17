import crypto from "node:crypto";
import { Prisma, DonationMethod, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { absoluteUrl } from "@/lib/site";
import { formatINR } from "@/lib/format";
import { grantMembershipForPurchase } from "@/services/memberships";
import { notifyByEmail } from "@/services/notifications";

function genReceiptNo(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `MEM-${ym}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export interface CreateMembershipPurchaseInput {
  planId: string;
  email: string;
  name?: string;
  amountPaise: number;
  method: DonationMethod;
  buyerId?: string | null;
}

export async function createMembershipPurchase(input: CreateMembershipPurchaseInput, ip?: string) {
  return prisma.membershipPurchase.create({
    data: {
      receiptNo: genReceiptNo(),
      planId: input.planId,
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
  await prisma.membershipPurchase.update({ where: { id }, data: { razorpayOrderId: orderId } });
}

/** Idempotent: only moves a non-PAID purchase to PAID, and grants membership on a real transition. */
export async function markPaid(id: string, razorpayPaymentId?: string) {
  const res = await prisma.membershipPurchase.updateMany({
    where: { id, status: { not: OrderStatus.PAID } },
    data: { status: OrderStatus.PAID, paidAt: new Date(), ...(razorpayPaymentId ? { razorpayPaymentId } : {}) },
  });
  if (res.count > 0) await grantMembershipForPurchase(id);
}

export function getMembershipPurchaseById(id: string) {
  return prisma.membershipPurchase.findUnique({ where: { id } });
}

export function getMembershipPurchaseByRazorpayOrderId(orderId: string) {
  return prisma.membershipPurchase.findFirst({ where: { razorpayOrderId: orderId } });
}

export async function submitManualRef(id: string, transactionRef: string) {
  await prisma.membershipPurchase.update({ where: { id }, data: { transactionRef } });
}

export async function getMembershipPurchaseForReceipt(id: string) {
  return prisma.membershipPurchase.findUnique({
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
      plan: { select: { name: true, durationDays: true } },
    },
  });
}

export async function sendMembershipReceiptEmail(purchaseId: string) {
  const p = await prisma.membershipPurchase.findUnique({
    where: { id: purchaseId },
    select: { id: true, receiptNo: true, email: true, amountPaise: true, plan: { select: { name: true } } },
  });
  if (!p) return;
  const accountUrl = absoluteUrl("/account");
  const receiptUrl = absoluteUrl(`/membership/receipt/${p.id}`);
  await sendEmail({
    to: p.email,
    subject: `Your PharmaCareers PREMIUM receipt — ${p.plan.name}`,
    text: `Thank you for going PREMIUM!\n\nPlan: ${p.plan.name}\nAmount: ${formatINR(p.amountPaise)}\nReceipt: ${p.receiptNo}\n\nYour membership is active. Sign in at ${accountUrl} with this email to download any resource.\nReceipt page: ${receiptUrl}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
      <h2>Welcome to PREMIUM!</h2>
      <p><strong>${p.plan.name}</strong></p>
      <p>Amount: <strong>${formatINR(p.amountPaise)}</strong><br/>Receipt: ${p.receiptNo}</p>
      <p>Your membership is active — <a href="${accountUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">go to your account</a> to download any resource.</p>
      <p style="font-size:13px;color:#666">Or <a href="${receiptUrl}">view your receipt</a>.</p>
    </div>`,
  });
  await notifyByEmail(p.email, {
    type: "MEMBERSHIP",
    title: "PREMIUM activated",
    body: `${p.plan.name} — enjoy all-access downloads`,
    href: "/account",
  });
}

export async function adminSetMembershipPurchaseStatus(id: string, status: OrderStatus) {
  const updated = await prisma.membershipPurchase.update({
    where: { id },
    data: { status, ...(status === OrderStatus.PAID ? { paidAt: new Date() } : {}) },
  });
  if (status === OrderStatus.PAID) await grantMembershipForPurchase(id);
  return updated;
}

export async function listMembershipPurchases(opts: { status?: OrderStatus; q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const where: Prisma.MembershipPurchaseWhereInput = {
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
    prisma.membershipPurchase.findMany({
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
        plan: { select: { name: true } },
      },
    }),
    prisma.membershipPurchase.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}
