"use server";

import { revalidatePath } from "next/cache";
import { deleteTag } from "@/services/tags";
import { requireAdmin } from "@/lib/session";
import { writeAudit } from "@/lib/audit";

export async function deleteTagAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireAdmin();
    await deleteTag(id);
    await writeAudit({ actorId: user.id, action: "DELETE", entityType: "Tag", entityId: id });
    revalidatePath("/admin/tags");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
