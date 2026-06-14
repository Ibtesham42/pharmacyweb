"use server";

import { revalidatePath } from "next/cache";
import { markMessageHandled } from "@/services/contact";
import { requireAdmin } from "@/lib/session";

export async function markHandledAction(
  id: string,
  handled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await markMessageHandled(id, handled);
    revalidatePath("/admin/messages");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
