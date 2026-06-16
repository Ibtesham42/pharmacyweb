import crypto from "node:crypto";
import { Prisma, DonationMethod, DonationStatus, FeatureStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/services/settings";
import {
  DEFAULT_DONATION_SETTINGS,
  supporterLevelFor,
  type BadgeThresholds,
  type DonationSettings,
  type PublicSupporter,
} from "@/lib/donations/config";

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
      // Consent enters the moderation queue; it is NOT publicly visible until approved.
      featureStatus: input.supporterConsent ? FeatureStatus.PENDING : FeatureStatus.NONE,
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

// ─────────────────────── Featured Supporters ───────────────────────

/** Admin: move a supporter through the feature lifecycle. */
export async function setFeatureStatus(id: string, status: FeatureStatus) {
  return prisma.donation.update({
    where: { id },
    // Stamp featuredAt only while APPROVED so analytics/ordering stay clean.
    data: { featureStatus: status, featuredAt: status === FeatureStatus.APPROVED ? new Date() : null },
  });
}

/** Admin: set/clear the curated public thank-you note for a supporter. */
export async function setFeaturedMessage(id: string, message: string) {
  return prisma.donation.update({
    where: { id },
    data: { featuredMessage: message.trim() || null },
  });
}

export type SupporterTab = "pending" | "featured" | "all";

/** Admin list of supporter requests (internal view — includes email). */
export async function listSupporters(opts: { tab?: SupporterTab; q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const base: Prisma.DonationWhereInput =
    opts.tab === "pending"
      ? { featureStatus: FeatureStatus.PENDING }
      : opts.tab === "featured"
        ? { featureStatus: FeatureStatus.APPROVED }
        : { OR: [{ supporterConsent: true }, { featureStatus: { not: FeatureStatus.NONE } }] };
  const where: Prisma.DonationWhereInput = {
    AND: [
      base,
      ...(opts.q
        ? [
            {
              OR: [
                { name: { contains: opts.q, mode: "insensitive" as const } },
                { email: { contains: opts.q, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };
  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy: [{ featureStatus: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        amountPaise: true,
        status: true,
        anonymous: true,
        supporterConsent: true,
        featureStatus: true,
        featuredMessage: true,
        createdAt: true,
        paidAt: true,
      },
    }),
    prisma.donation.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/**
 * Public, privacy-safe supporters wall. Only APPROVED + PAID donations.
 * Anonymous donors are shown as "Anonymous Supporter". No email/phone/amount.
 */
export async function getPublicFeaturedSupporters(opts?: {
  limit?: number;
  thresholds?: BadgeThresholds;
}): Promise<PublicSupporter[]> {
  const settings = opts?.limit && opts?.thresholds ? null : await getDonationSettings();
  const limit = opts?.limit ?? settings!.featuredMaxShow;
  const thresholds = opts?.thresholds ?? settings!.badgeThresholds;
  const rows = await prisma.donation.findMany({
    where: { featureStatus: FeatureStatus.APPROVED, status: DonationStatus.PAID },
    orderBy: [{ amountPaise: "desc" }, { featuredAt: "desc" }],
    take: Math.min(Math.max(1, limit), 60),
    select: {
      id: true,
      name: true,
      anonymous: true,
      amountPaise: true,
      featuredMessage: true,
      featuredAt: true,
      paidAt: true,
      createdAt: true,
    },
  });
  return rows.map((r) => {
    const meta = supporterLevelFor(r.amountPaise, thresholds);
    return {
      id: r.id,
      name: r.anonymous ? "Anonymous Supporter" : r.name,
      level: meta.level,
      levelLabel: meta.label,
      levelClassName: meta.className,
      message: r.featuredMessage ?? null,
      date: (r.featuredAt ?? r.paidAt ?? r.createdAt).toISOString(),
    };
  });
}

/** Admin analytics for the Featured Supporters programme. */
export async function featuredAnalytics() {
  const approvedWhere = { featureStatus: FeatureStatus.APPROVED };
  const [totalFeatured, pendingRequests, approvedRows, topRows] = await Promise.all([
    prisma.donation.count({ where: approvedWhere }),
    prisma.donation.count({ where: { featureStatus: FeatureStatus.PENDING } }),
    prisma.donation.findMany({
      where: { ...approvedWhere, featuredAt: { not: null } },
      select: { featuredAt: true },
    }),
    prisma.donation.groupBy({
      by: ["email"],
      where: { status: DonationStatus.PAID },
      _sum: { amountPaise: true },
      _count: true,
      orderBy: { _sum: { amountPaise: "desc" } },
      take: 5,
    }),
  ]);

  // Featured supporters bucketed into the last 6 calendar months.
  const months: { key: string; label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-IN", { month: "short" }),
      count: 0,
    });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const r of approvedRows) {
    if (!r.featuredAt) continue;
    const key = `${r.featuredAt.getFullYear()}-${String(r.featuredAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.count++;
  }

  const emails = topRows.map((r) => r.email);
  const names = emails.length
    ? await prisma.donation.findMany({
        where: { email: { in: emails }, status: DonationStatus.PAID },
        select: { email: true, name: true, anonymous: true },
        distinct: ["email"],
      })
    : [];
  const nameByEmail = new Map(names.map((n) => [n.email, n.anonymous ? "Anonymous Supporter" : n.name]));
  const mostActive = topRows.map((r) => ({
    name: nameByEmail.get(r.email) ?? "Supporter",
    total: r._sum.amountPaise ?? 0,
    donations: r._count,
  }));

  return { totalFeatured, pendingRequests, byMonth: months, mostActive };
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
