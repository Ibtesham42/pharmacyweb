import { MembershipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureBuyer } from "@/services/buyers";
import type { MembershipPlanInput } from "@/lib/validation";

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Plans ──
export function listActivePlans() {
  return prisma.membershipPlan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { pricePaise: "asc" }],
  });
}

export function listAllPlans() {
  return prisma.membershipPlan.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}

export function getPlanById(id: string) {
  return prisma.membershipPlan.findUnique({ where: { id } });
}

export function createPlan(input: MembershipPlanInput) {
  return prisma.membershipPlan.create({
    data: {
      name: input.name,
      description: input.description || null,
      durationDays: input.durationDays,
      pricePaise: input.pricePaise,
      badge: input.badge || null,
      tier: input.tier,
      benefits: input.benefits,
      active: input.active,
      sortOrder: input.sortOrder,
    },
  });
}

export function updatePlan(id: string, input: MembershipPlanInput) {
  return prisma.membershipPlan.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description || null,
      durationDays: input.durationDays,
      pricePaise: input.pricePaise,
      badge: input.badge || null,
      tier: input.tier,
      benefits: input.benefits,
      active: input.active,
      sortOrder: input.sortOrder,
    },
  });
}

export function deletePlan(id: string) {
  return prisma.membershipPlan.delete({ where: { id } });
}

// ── Membership window ──
export function getMembershipByBuyer(buyerId: string) {
  return prisma.membership.findUnique({ where: { buyerId }, include: { plan: { select: { name: true } } } });
}

/** A membership unlocks content ONLY when APPROVED and within its (non-null) window. */
function isActive(m: { status: MembershipStatus; expiresAt: Date | null } | null): boolean {
  return Boolean(m && m.status === MembershipStatus.APPROVED && m.expiresAt && m.expiresAt > new Date());
}

/** True only if this buyer (by id or email) has an APPROVED, unexpired membership. */
export async function hasActiveMembership(buyerId?: string | null, email?: string | null): Promise<boolean> {
  const active = { status: MembershipStatus.APPROVED, expiresAt: { gt: new Date() } };
  if (buyerId) {
    const m = await prisma.membership.findFirst({ where: { buyerId, ...active }, select: { id: true } });
    if (m) return true;
  }
  if (email) {
    const m = await prisma.membership.findFirst({
      where: { buyer: { email: email.toLowerCase() }, ...active },
      select: { id: true },
    });
    if (m) return true;
  }
  return false;
}

export async function activeMemberCount(): Promise<number> {
  return prisma.membership.count({ where: { status: MembershipStatus.APPROVED, expiresAt: { gt: new Date() } } });
}

async function resolveBuyerId(p: { buyerId: string | null; email: string }): Promise<string> {
  if (p.buyerId) return p.buyerId;
  const buyer = await prisma.buyer.upsert({
    where: { email: p.email.toLowerCase() },
    update: {},
    create: { email: p.email.toLowerCase() },
  });
  return buyer.id;
}

/**
 * Record a PENDING membership request from a PAID purchase — does NOT activate.
 * Idempotency is the caller's (only invoke on a real PENDING→PAID transition).
 * If the buyer is already APPROVED+active (a renewal), their live access is left
 * untouched; the new purchase stays PENDING in the admin queue until approved.
 */
export async function requestMembershipForPurchase(purchaseId: string): Promise<void> {
  const p = await prisma.membershipPurchase.findUnique({
    where: { id: purchaseId },
    select: { id: true, planId: true, buyerId: true, email: true },
  });
  if (!p) return;
  const buyerId = await resolveBuyerId(p);
  const existing = await prisma.membership.findUnique({ where: { buyerId } });
  if (isActive(existing)) return; // renewal — keep current access live; new purchase awaits approval
  await prisma.membership.upsert({
    where: { buyerId },
    update: { status: MembershipStatus.PENDING, planId: p.planId, purchaseId: p.id, expiresAt: null },
    create: { buyerId, planId: p.planId, purchaseId: p.id, status: MembershipStatus.PENDING },
  });
}

/** Admin: approve a paid purchase → activate/extend PREMIUM (extends from current expiry if still active). */
export async function approveMembershipPurchase(purchaseId: string, adminId: string): Promise<boolean> {
  const p = await prisma.membershipPurchase.findUnique({
    where: { id: purchaseId },
    select: { id: true, planId: true, buyerId: true, email: true, plan: { select: { durationDays: true } } },
  });
  if (!p) return false;
  const buyerId = await resolveBuyerId(p);
  const now = new Date();
  const existing = await prisma.membership.findUnique({ where: { buyerId } });
  const base = isActive(existing) ? existing!.expiresAt! : now;
  const expiresAt = new Date(base.getTime() + p.plan.durationDays * DAY_MS);
  await prisma.$transaction([
    prisma.membershipPurchase.update({ where: { id: p.id }, data: { membershipStatus: MembershipStatus.APPROVED } }),
    prisma.membership.upsert({
      where: { buyerId },
      update: { status: MembershipStatus.APPROVED, planId: p.planId, expiresAt, purchaseId: p.id, reviewedAt: now, reviewedById: adminId },
      create: { buyerId, planId: p.planId, status: MembershipStatus.APPROVED, startedAt: now, expiresAt, purchaseId: p.id, reviewedAt: now, reviewedById: adminId },
    }),
  ]);
  return true;
}

/** Admin: reject a purchase → no access. Never revokes an already-active window. */
export async function rejectMembershipPurchase(purchaseId: string, adminId: string): Promise<boolean> {
  const p = await prisma.membershipPurchase.findUnique({
    where: { id: purchaseId },
    select: { id: true, buyerId: true, email: true },
  });
  if (!p) return false;
  await prisma.membershipPurchase.update({ where: { id: p.id }, data: { membershipStatus: MembershipStatus.REJECTED } });
  const buyerId = p.buyerId ?? (await prisma.buyer.findUnique({ where: { email: p.email.toLowerCase() }, select: { id: true } }))?.id;
  if (buyerId) {
    const existing = await prisma.membership.findUnique({ where: { buyerId } });
    if (existing && !isActive(existing) && existing.purchaseId === p.id) {
      await prisma.membership.update({ where: { buyerId }, data: { status: MembershipStatus.REJECTED, reviewedAt: new Date(), reviewedById: adminId } });
    }
  }
  return true;
}

/** Admin: suspend a buyer's PREMIUM immediately (blocks regardless of expiry). */
export async function suspendMembership(email: string, adminId?: string) {
  const buyer = await prisma.buyer.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  if (!buyer) return;
  await prisma.membership.updateMany({
    where: { buyerId: buyer.id },
    data: { status: MembershipStatus.SUSPENDED, ...(adminId ? { reviewedAt: new Date(), reviewedById: adminId } : {}) },
  });
}

/** Admin: extend/activate a buyer's PREMIUM by N days (sets APPROVED, extends from current expiry). */
export async function extendMembership(email: string, durationDays: number, adminId?: string) {
  const buyer = await ensureBuyer(email);
  const now = new Date();
  const existing = await prisma.membership.findUnique({ where: { buyerId: buyer.id } });
  const base = isActive(existing) ? existing!.expiresAt! : now;
  const expiresAt = new Date(base.getTime() + durationDays * DAY_MS);
  return prisma.membership.upsert({
    where: { buyerId: buyer.id },
    update: { status: MembershipStatus.APPROVED, expiresAt, ...(adminId ? { reviewedAt: now, reviewedById: adminId } : {}) },
    create: { buyerId: buyer.id, status: MembershipStatus.APPROVED, startedAt: now, expiresAt, ...(adminId ? { reviewedAt: now, reviewedById: adminId } : {}) },
  });
}

/** Admin (Users page): grant/extend a complimentary PREMIUM membership (pre-approved, no payment). */
export function grantCompMembership(email: string, durationDays: number) {
  return extendMembership(email, durationDays);
}

/** Admin (Users page): revoke PREMIUM by suspending the membership. */
export function revokeMembership(email: string) {
  return suspendMembership(email);
}
