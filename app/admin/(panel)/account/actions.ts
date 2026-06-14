"use server";

import { revalidatePath } from "next/cache";
import { profileSchema, passwordChangeSchema } from "@/lib/validation";
import { updateProfile, changePassword } from "@/services/account";
import { requireAdmin } from "@/lib/session";
import { writeAudit } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export async function updateProfileAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = profileSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await updateProfile(user.id, parsed.data);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "User", entityId: user.id, after: { email: parsed.data.email } });
    revalidatePath("/admin/account");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function changePasswordAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = passwordChangeSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "User", entityId: user.id, after: { passwordChanged: true } });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
