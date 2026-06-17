"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/session";
import { membershipPlanSchema } from "@/lib/validation";
import { createPlan, updatePlan, deletePlan } from "@/services/memberships";
import { adminSetMembershipPurchaseStatus, sendMembershipReceiptEmail } from "@/services/membership-purchases";
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
    await adminSetMembershipPurchaseStatus(id, status);
    if (status === OrderStatus.PAID) void sendMembershipReceiptEmail(id);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "MembershipPurchase", entityId: id, after: { status } });
    revalidatePath("/admin/resources/memberships/purchases");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
