import { prisma } from "@/lib/prisma";
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

/** True if this buyer (by id or email) has a membership whose window is still open. */
export async function hasActiveMembership(buyerId?: string | null, email?: string | null): Promise<boolean> {
  const now = new Date();
  if (buyerId) {
    const m = await prisma.membership.findFirst({ where: { buyerId, expiresAt: { gt: now } }, select: { id: true } });
    if (m) return true;
  }
  if (email) {
    const m = await prisma.membership.findFirst({
      where: { buyer: { email: email.toLowerCase() }, expiresAt: { gt: now } },
      select: { id: true },
    });
    if (m) return true;
  }
  return false;
}

export async function activeMemberCount(): Promise<number> {
  return prisma.membership.count({ where: { expiresAt: { gt: new Date() } } });
}

/**
 * Grant or extend a buyer's membership from a PAID purchase. Idempotency is the
 * caller's responsibility (only invoke on a real PENDING→PAID transition).
 * Renewing while still active extends from the current expiry, else from now.
 */
export async function grantMembershipForPurchase(purchaseId: string): Promise<void> {
  const p = await prisma.membershipPurchase.findUnique({
    where: { id: purchaseId },
    select: { planId: true, buyerId: true, email: true, plan: { select: { durationDays: true } } },
  });
  if (!p) return;

  let buyerId = p.buyerId;
  if (!buyerId) {
    const buyer = await prisma.buyer.upsert({
      where: { email: p.email.toLowerCase() },
      update: {},
      create: { email: p.email.toLowerCase() },
    });
    buyerId = buyer.id;
  }

  const now = new Date();
  const existing = await prisma.membership.findUnique({ where: { buyerId } });
  const base = existing && existing.expiresAt > now ? existing.expiresAt : now;
  const expiresAt = new Date(base.getTime() + p.plan.durationDays * DAY_MS);

  await prisma.membership.upsert({
    where: { buyerId },
    update: { planId: p.planId, expiresAt },
    create: { buyerId, planId: p.planId, startedAt: now, expiresAt },
  });
}
