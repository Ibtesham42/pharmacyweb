"use server";

import { revalidatePath } from "next/cache";
import { profileSchema, passwordChangeSchema } from "@/lib/validation";
import { updateProfile, changePassword } from "@/services/account";
import { requireUser } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export async function updateProfileAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireUser();
    const parsed = profileSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    // Email is kept as-is on the client (read-only) to preserve the marketplace email bridge.
    await updateProfile(user.id, { name: parsed.data.name, email: user.email ?? parsed.data.email });
    revalidatePath("/account");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function changePasswordAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireUser();
    const parsed = passwordChangeSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
