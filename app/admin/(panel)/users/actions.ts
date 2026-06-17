"use server";

import { revalidatePath } from "next/cache";
import { UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { setUserStatus } from "@/services/admin-users";
import { grantCompMembership, revokeMembership } from "@/services/memberships";
import { writeAudit } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export async function setUserStatusAction(id: string, status: UserStatus): Promise<Result> {
  try {
    const admin = await requireAdmin();
    if (id === admin.id) return { ok: false, error: "You can’t change your own status." };
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return { ok: false, error: "User not found" };
    if (target.role === "ADMIN") return { ok: false, error: "Admins can’t be suspended." };
    await setUserStatus(id, status);
    await writeAudit({ actorId: admin.id, action: "UPDATE", entityType: "User", entityId: id, after: { status } });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function grantPremiumAction(id: string, durationDays: number): Promise<Result> {
  try {
    const admin = await requireAdmin();
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!target) return { ok: false, error: "User not found" };
    const days = Math.max(1, Math.min(3650, Math.round(durationDays || 0)));
    await grantCompMembership(target.email, days);
    await writeAudit({ actorId: admin.id, action: "UPDATE", entityType: "Membership", entityId: id, after: { grantedDays: days } });
    revalidatePath(`/admin/users/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function revokePremiumAction(id: string): Promise<Result> {
  try {
    const admin = await requireAdmin();
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!target) return { ok: false, error: "User not found" };
    await revokeMembership(target.email);
    await writeAudit({ actorId: admin.id, action: "UPDATE", entityType: "Membership", entityId: id, after: { revoked: true } });
    revalidatePath(`/admin/users/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
