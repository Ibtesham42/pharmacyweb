import crypto from "node:crypto";
import { Prisma, DonationMethod, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { signDownloadToken } from "@/lib/download-token";
import { absoluteUrl } from "@/lib/site";
import { formatINR } from "@/lib/format";
import { notifyByEmail } from "@/services/notifications";

function genReceiptNo(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `RES-${ym}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export interface CreatePurchaseInput {
  resourceId: string;
  email: string;
  name?: string;
  amountPaise: number;
  method: DonationMethod;
  buyerId?: string | null;
}

export async function createPurchase(input: CreatePurchaseInput, ip?: string) {
  return prisma.resourcePurchase.create({
    data: {
      receiptNo: genReceiptNo(),
      resourceId: input.resourceId,
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
  await prisma.resourcePurchase.update({ where: { id }, data: { razorpayOrderId: orderId } });
}

/** Idempotent: only moves a non-PAID purchase to PAID. */
export async function markPaid(id: string, razorpayPaymentId?: string) {
  await prisma.resourcePurchase.updateMany({
    where: { id, status: { not: OrderStatus.PAID } },
    data: {
      status: OrderStatus.PAID,
      paidAt: new Date(),
      ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
    },
  });
}

export async function markPaidByOrderId(orderId: string, razorpayPaymentId?: string) {
  await prisma.resourcePurchase.updateMany({
    where: { razorpayOrderId: orderId, status: { not: OrderStatus.PAID } },
    data: {
      status: OrderStatus.PAID,
      paidAt: new Date(),
      ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
    },
  });
}

export async function submitManualRef(id: string, transactionRef: string) {
  await prisma.resourcePurchase.update({ where: { id }, data: { transactionRef } });
}

export function getPurchaseById(id: string) {
  return prisma.resourcePurchase.findUnique({ where: { id } });
}

export function getPurchaseByRazorpayOrderId(orderId: string) {
  return prisma.resourcePurchase.findFirst({ where: { razorpayOrderId: orderId } });
}

/** Receipt-safe view (no IP / payment internals beyond the reference). */
export async function getPurchaseForReceipt(id: string) {
  return prisma.resourcePurchase.findUnique({
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
      resource: { select: { title: true, slug: true } },
    },
  });
}

/** Email a receipt + secure re-download link once a purchase is PAID. */
export async function sendResourceReceiptEmail(purchaseId: string) {
  const p = await prisma.resourcePurchase.findUnique({
    where: { id: purchaseId },
    select: {
      id: true,
      receiptNo: true,
      email: true,
      name: true,
      amountPaise: true,
      resourceId: true,
      resource: { select: { title: true, slug: true } },
    },
  });
  if (!p) return;
  const token = signDownloadToken({ resourceId: p.resourceId, email: p.email });
  const downloadUrl = absoluteUrl(`/api/resources/${p.resource.slug}/download?token=${encodeURIComponent(token)}`);
  const receiptUrl = absoluteUrl(`/store/receipt/${p.id}`);
  await sendEmail({
    to: p.email,
    subject: `Your PharmaCareers receipt — ${p.resource.title}`,
    text: `Thank you for your purchase!\n\nResource: ${p.resource.title}\nAmount: ${formatINR(p.amountPaise)}\nReceipt: ${p.receiptNo}\n\nDownload: ${downloadUrl}\nReceipt page: ${receiptUrl}\n\nYou can also sign in at ${absoluteUrl("/account")} with this email to re-download anytime.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
      <h2>Thank you for your purchase!</h2>
      <p><strong>${p.resource.title}</strong></p>
      <p>Amount: <strong>${formatINR(p.amountPaise)}</strong><br/>Receipt: ${p.receiptNo}</p>
      <p><a href="${downloadUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Download your resource</a></p>
      <p style="font-size:13px;color:#666">Or <a href="${receiptUrl}">view your receipt</a>. Sign in at <a href="${absoluteUrl("/account")}">your account</a> with this email to re-download anytime.</p>
    </div>`,
  });
  await notifyByEmail(p.email, {
    type: "PURCHASE",
    title: "Purchase confirmed",
    body: p.resource.title,
    href: `/store/receipt/${p.id}`,
  });
}

export async function adminSetPurchaseStatus(id: string, status: OrderStatus) {
  return prisma.resourcePurchase.update({
    where: { id },
    data: { status, ...(status === OrderStatus.PAID ? { paidAt: new Date() } : {}) },
  });
}

export async function listPurchases(opts: { status?: OrderStatus; q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const where: Prisma.ResourcePurchaseWhereInput = {
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
    prisma.resourcePurchase.findMany({
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
        resource: { select: { title: true } },
      },
    }),
    prisma.resourcePurchase.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Purchases visible in a buyer's dashboard (re-download list). */
export async function listBuyerPurchases(buyerId: string, email: string) {
  return prisma.resourcePurchase.findMany({
    where: { status: OrderStatus.PAID, OR: [{ buyerId }, { email: email.toLowerCase() }] },
    orderBy: { paidAt: "desc" },
    select: {
      id: true,
      receiptNo: true,
      amountPaise: true,
      paidAt: true,
      resource: { select: { title: true, slug: true, fileType: true } },
    },
  });
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function marketplaceAnalytics() {
  const paid = { status: OrderStatus.PAID };
  const [revAgg, paidCount, totalCount, monthAgg, topPurchasedRows, mostDownloaded, paidWithCat] =
    await Promise.all([
      prisma.resourcePurchase.aggregate({ _sum: { amountPaise: true }, where: paid }),
      prisma.resourcePurchase.count({ where: paid }),
      prisma.resourcePurchase.count(),
      prisma.resourcePurchase.aggregate({ _sum: { amountPaise: true }, where: { ...paid, paidAt: { gte: startOfMonth() } } }),
      prisma.resourcePurchase.groupBy({
        by: ["resourceId"],
        where: paid,
        _sum: { amountPaise: true },
        _count: true,
        orderBy: { _sum: { amountPaise: "desc" } },
        take: 8,
      }),
      prisma.resource.findMany({
        where: { deletedAt: null },
        orderBy: { downloadCount: "desc" },
        take: 8,
        select: { id: true, title: true, slug: true, downloadCount: true },
      }),
      prisma.resourcePurchase.findMany({
        where: paid,
        take: 2000,
        select: { amountPaise: true, resource: { select: { category: { select: { name: true } } } } },
      }),
    ]);

  const ids = topPurchasedRows.map((r) => r.resourceId);
  const titles = ids.length
    ? await prisma.resource.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, slug: true } })
    : [];
  const titleById = new Map(titles.map((t) => [t.id, t]));
  const topPurchased = topPurchasedRows.map((r) => ({
    title: titleById.get(r.resourceId)?.title ?? "Resource",
    slug: titleById.get(r.resourceId)?.slug ?? "",
    revenue: r._sum.amountPaise ?? 0,
    count: r._count,
  }));

  const byCat = new Map<string, number>();
  for (const p of paidWithCat) {
    const name = p.resource.category?.name ?? "Uncategorised";
    byCat.set(name, (byCat.get(name) ?? 0) + p.amountPaise);
  }
  const revenueByCategory = [...byCat.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return {
    totalRevenuePaise: revAgg._sum.amountPaise ?? 0,
    monthRevenuePaise: monthAgg._sum.amountPaise ?? 0,
    paidCount,
    totalCount,
    conversion: totalCount ? Math.round((paidCount / totalCount) * 100) : 0,
    topPurchased,
    mostDownloaded,
    revenueByCategory,
  };
}
