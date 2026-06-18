import crypto from "node:crypto";
import { Prisma, DonationMethod, OrderStatus, MembershipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { absoluteUrl } from "@/lib/site";
import { formatINR } from "@/lib/format";
import { requestMembershipForPurchase } from "@/services/memberships";
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

/**
 * Idempotent transition to PAID. Records a PENDING membership request (does NOT
 * activate — PREMIUM activates only on admin approval) and returns `true` ONLY on
 * the first transition, so the pending request, receipt email and notification
 * each happen exactly once across verify + webhook + retries.
 */
export async function markPaid(id: string, razorpayPaymentId?: string): Promise<boolean> {
  const res = await prisma.membershipPurchase.updateMany({
    where: { id, status: { not: OrderStatus.PAID } },
    data: { status: OrderStatus.PAID, paidAt: new Date(), ...(razorpayPaymentId ? { razorpayPaymentId } : {}) },
  });
  if (res.count > 0) await requestMembershipForPurchase(id);
  return res.count > 0;
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
      membershipStatus: true,
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
    subject: `Payment received — your PharmaCareers PREMIUM is pending verification`,
    text: `Thank you! We've received your payment.\n\nPlan: ${p.plan.name}\nAmount: ${formatINR(p.amountPaise)}\nReceipt: ${p.receiptNo}\n\nYour PREMIUM membership is PENDING admin verification — you'll get another email the moment it's approved and your access is active. Track status at ${accountUrl}.\nReceipt page: ${receiptUrl}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
      <h2>Payment received — pending verification</h2>
      <p><strong>${p.plan.name}</strong></p>
      <p>Amount: <strong>${formatINR(p.amountPaise)}</strong><br/>Receipt: ${p.receiptNo}</p>
      <p>Your PREMIUM membership is <strong>pending admin verification</strong>. We'll email you the moment it's approved and your all-access downloads are live.</p>
      <p><a href="${accountUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Check status in your account</a></p>
      <p style="font-size:13px;color:#666">Or <a href="${receiptUrl}">view your receipt</a>.</p>
    </div>`,
  });
  await notifyByEmail(p.email, {
    type: "MEMBERSHIP",
    title: "Payment received — PREMIUM pending verification",
    body: `${p.plan.name} — awaiting admin approval`,
    href: "/account",
  });
}

/** Sent when an admin APPROVES the purchase and PREMIUM becomes active. */
export async function sendMembershipApprovedEmail(purchaseId: string) {
  const p = await prisma.membershipPurchase.findUnique({
    where: { id: purchaseId },
    select: { id: true, email: true, plan: { select: { name: true } } },
  });
  if (!p) return;
  const accountUrl = absoluteUrl("/account");
  await sendEmail({
    to: p.email,
    subject: `Your PharmaCareers PREMIUM is now active — ${p.plan.name}`,
    text: `Good news! Your PREMIUM membership has been approved and is now active.\n\nPlan: ${p.plan.name}\n\nSign in at ${accountUrl} with this email to download any paid or premium resource.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
      <h2>Welcome to PREMIUM!</h2>
      <p>Your membership <strong>${p.plan.name}</strong> has been approved and is now active.</p>
      <p><a href="${accountUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Go to your account</a> to download any resource.</p>
    </div>`,
  });
  await notifyByEmail(p.email, {
    type: "MEMBERSHIP",
    title: "PREMIUM activated",
    body: `${p.plan.name} — enjoy all-access downloads`,
    href: "/account",
  });
}

/**
 * Admin "Mark paid" — records that the money arrived (manual UPI). Returns `true`
 * only on the first transition to PAID; records a PENDING membership request.
 * This does NOT activate PREMIUM — that requires a separate Approve action.
 */
export async function adminSetMembershipPurchaseStatus(id: string, status: OrderStatus): Promise<boolean> {
  if (status === OrderStatus.PAID) {
    const res = await prisma.membershipPurchase.updateMany({
      where: { id, status: { not: OrderStatus.PAID } },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });
    if (res.count > 0) {
      await requestMembershipForPurchase(id);
      return true;
    }
    return false;
  }
  await prisma.membershipPurchase.update({ where: { id }, data: { status } });
  return false;
}

export async function listMembershipPurchases(opts: {
  status?: OrderStatus;
  membershipStatus?: MembershipStatus;
  q?: string;
  page?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const where: Prisma.MembershipPurchaseWhereInput = {
    ...(opts.status && { status: opts.status }),
    ...(opts.membershipStatus && { membershipStatus: opts.membershipStatus }),
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
        membershipStatus: true,
        transactionRef: true,
        razorpayPaymentId: true,
        createdAt: true,
        paidAt: true,
        plan: { select: { name: true } },
        buyer: { select: { userId: true } },
      },
    }),
    prisma.membershipPurchase.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Count of PAID purchases still awaiting admin verification (for the nav badge). */
export function pendingVerificationCount(): Promise<number> {
  return prisma.membershipPurchase.count({
    where: { status: OrderStatus.PAID, membershipStatus: MembershipStatus.PENDING },
  });
}
