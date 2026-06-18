"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/session";
import { membershipPlanSchema } from "@/lib/validation";
import {
  createPlan,
  updatePlan,
  deletePlan,
  approveMembershipPurchase,
  rejectMembershipPurchase,
  suspendMembership,
  extendMembership,
} from "@/services/memberships";
import {
  adminSetMembershipPurchaseStatus,
  sendMembershipReceiptEmail,
  sendMembershipApprovedEmail,
  getMembershipPurchaseById,
} from "@/services/membership-purchases";
import { writeAudit } from "@/lib/audit";

type Result = { ok: true; id?: string } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function revalidate() {
  revalidatePath("/admin/resources/memberships");
  revalidatePath("/membership");
}

export async function createPlanAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = membershipPlanSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    const plan = await createPlan(parsed.data);
    await writeAudit({ actorId: user.id, action: "CREATE", entityType: "MembershipPlan", entityId: plan.id });
    revalidate();
    return { ok: true, id: plan.id };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updatePlanAction(id: string, raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = membershipPlanSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await updatePlan(id, parsed.data);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "MembershipPlan", entityId: id });
    revalidate();
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function deletePlanAction(id: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    await deletePlan(id);
    await writeAudit({ actorId: user.id, action: "DELETE", entityType: "MembershipPlan", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function setMembershipPurchaseStatusAction(id: string, status: OrderStatus): Promise<Result> {
  try {
    const user = await requireAdmin();
    // Records payment (manual UPI) only — does NOT activate PREMIUM. Email the
    // "payment received / pending verification" receipt on the first transition.
    if (await adminSetMembershipPurchaseStatus(id, status)) void sendMembershipReceiptEmail(id);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "MembershipPurchase", entityId: id, after: { status } });
    revalidatePath("/admin/resources/memberships/purchases");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

// ── Membership verification (approval workflow) ──
function revalidateVerification() {
  revalidatePath("/admin/resources/memberships/purchases");
  revalidatePath("/account");
}

export async function approveMembershipAction(id: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    const ok = await approveMembershipPurchase(id, user.id);
    if (!ok) return { ok: false, error: "Purchase not found" };
    void sendMembershipApprovedEmail(id);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "MembershipPurchase", entityId: id, after: { verification: "APPROVED" } });
    revalidateVerification();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function rejectMembershipAction(id: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    const ok = await rejectMembershipPurchase(id, user.id);
    if (!ok) return { ok: false, error: "Purchase not found" };
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "MembershipPurchase", entityId: id, after: { verification: "REJECTED" } });
    revalidateVerification();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function suspendMembershipAction(id: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    const p = await getMembershipPurchaseById(id);
    if (!p) return { ok: false, error: "Purchase not found" };
    await suspendMembership(p.email, user.id);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "Membership", entityId: id, after: { suspended: true } });
    revalidateVerification();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function extendMembershipAction(id: string, days: number): Promise<Result> {
  try {
    const user = await requireAdmin();
    const p = await getMembershipPurchaseById(id);
    if (!p) return { ok: false, error: "Purchase not found" };
    const d = Math.max(1, Math.min(3650, Math.round(days || 0)));
    await extendMembership(p.email, d, user.id);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "Membership", entityId: id, after: { extendedDays: d } });
    revalidateVerification();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
