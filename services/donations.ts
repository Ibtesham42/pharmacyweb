import crypto from "node:crypto";
import { Prisma, DonationMethod, DonationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/services/settings";
import { DEFAULT_DONATION_SETTINGS, type DonationSettings } from "@/lib/donations/config";

const KEY = "donations";

export async function getDonationSettings(): Promise<DonationSettings> {
  const stored = await getSetting<Partial<DonationSettings>>(KEY);
  return { ...DEFAULT_DONATION_SETTINGS, ...(stored ?? {}) };
}

export async function setDonationSettings(value: DonationSettings): Promise<void> {
  await setSetting(KEY, value);
}

function genReceiptNo(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `RCPT-${ym}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export interface CreateDonationInput {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  amountPaise: number;
  method: DonationMethod;
  source?: string;
  anonymous: boolean;
  supporterConsent: boolean;
  reason?: string;
  feedback?: string;
}

export async function createDonation(input: CreateDonationInput, ip?: string) {
  return prisma.donation.create({
    data: {
      receiptNo: genReceiptNo(),
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      city: input.city || null,
      state: input.state || null,
      address: input.address || null,
      amountPaise: input.amountPaise,
      method: input.method,
      source: input.source || null,
      anonymous: input.anonymous,
      supporterConsent: input.supporterConsent,
      reason: input.reason || null,
      feedback: input.feedback || null,
      ip: ip || null,
    },
  });
}

export async function attachRazorpayOrder(id: string, orderId: string) {
  await prisma.donation.update({ where: { id }, data: { razorpayOrderId: orderId } });
}

/** Idempotent: only moves a non-PAID donation to PAID. */
export async function markPaid(id: string, razorpayPaymentId?: string) {
  await prisma.donation.updateMany({
    where: { id, status: { not: DonationStatus.PAID } },
    data: {
      status: DonationStatus.PAID,
      paidAt: new Date(),
      ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
    },
  });
}

export async function markPaidByOrderId(orderId: string, razorpayPaymentId?: string) {
  await prisma.donation.updateMany({
    where: { razorpayOrderId: orderId, status: { not: DonationStatus.PAID } },
    data: {
      status: DonationStatus.PAID,
      paidAt: new Date(),
      ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
    },
  });
}

export async function submitManualRef(id: string, transactionRef: string) {
  await prisma.donation.update({ where: { id }, data: { transactionRef } });
}

export async function getDonationById(id: string) {
  return prisma.donation.findUnique({ where: { id } });
}

/** Receipt-safe view — excludes phone/email/address. */
export async function getDonationForReceipt(id: string) {
  return prisma.donation.findUnique({
    where: { id },
    select: {
      id: true,
      receiptNo: true,
      name: true,
      anonymous: true,
      amountPaise: true,
      currency: true,
      method: true,
      status: true,
      razorpayPaymentId: true,
      transactionRef: true,
      reason: true,
      createdAt: true,
      paidAt: true,
    },
  });
}

export async function adminSetStatus(id: string, status: DonationStatus) {
  return prisma.donation.update({
    where: { id },
    data: { status, ...(status === DonationStatus.PAID ? { paidAt: new Date() } : {}) },
  });
}

export async function listDonations(opts: { status?: DonationStatus; q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const where: Prisma.DonationWhereInput = {
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
    prisma.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.donation.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function donationStats() {
  const paidWhere = { status: DonationStatus.PAID };
  const [paidAgg, paidCount, totalCount, donorRows, monthAgg, recent, topRows, bySourceRows] =
    await Promise.all([
      prisma.donation.aggregate({ _sum: { amountPaise: true }, _avg: { amountPaise: true }, where: paidWhere }),
      prisma.donation.count({ where: paidWhere }),
      prisma.donation.count(),
      prisma.donation.findMany({ where: paidWhere, distinct: ["email"], select: { email: true } }),
      prisma.donation.aggregate({ _sum: { amountPaise: true }, where: { ...paidWhere, paidAt: { gte: startOfMonth() } } }),
      prisma.donation.findMany({
        where: paidWhere,
        orderBy: { paidAt: "desc" },
        take: 10,
        select: { id: true, name: true, anonymous: true, amountPaise: true, createdAt: true, paidAt: true, source: true },
      }),
      prisma.donation.groupBy({
        by: ["email"],
        where: paidWhere,
        _sum: { amountPaise: true },
        orderBy: { _sum: { amountPaise: "desc" } },
        take: 10,
      }),
      prisma.donation.groupBy({ by: ["source"], where: paidWhere, _sum: { amountPaise: true }, _count: true }),
    ]);

  const topEmails = topRows.map((r) => r.email);
  const names = topEmails.length
    ? await prisma.donation.findMany({
        where: { email: { in: topEmails }, ...paidWhere },
        select: { email: true, name: true, anonymous: true },
        distinct: ["email"],
      })
    : [];
  const nameByEmail = new Map(names.map((n) => [n.email, n.anonymous ? "Anonymous" : n.name]));
  const topSupporters = topRows.map((r) => ({
    name: nameByEmail.get(r.email) ?? "Supporter",
    total: r._sum.amountPaise ?? 0,
  }));

  return {
    totalRaisedPaise: paidAgg._sum.amountPaise ?? 0,
    paidCount,
    totalCount,
    donors: donorRows.length,
    avgPaise: Math.round(paidAgg._avg.amountPaise ?? 0),
    monthRaisedPaise: monthAgg._sum.amountPaise ?? 0,
    conversion: totalCount ? Math.round((paidCount / totalCount) * 100) : 0,
    recent,
    topSupporters,
    bySource: bySourceRows.map((r) => ({
      source: r.source ?? "direct",
      total: r._sum.amountPaise ?? 0,
      count: r._count,
    })),
  };
}

export async function donationsCsv(): Promise<string> {
  const rows = await prisma.donation.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
  const header = [
    "receiptNo", "name", "email", "phone", "city", "state", "amountINR", "method", "status",
    "transactionRef", "razorpayPaymentId", "source", "reason", "createdAt", "paidAt",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r.receiptNo, r.name, r.email, r.phone, r.city, r.state, (r.amountPaise / 100).toFixed(2),
      r.method, r.status, r.transactionRef, r.razorpayPaymentId, r.source, r.reason,
      r.createdAt.toISOString(), r.paidAt?.toISOString() ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
