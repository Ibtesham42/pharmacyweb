"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adSchema } from "@/lib/validation";
import { createAd, updateAd, deleteAd } from "@/services/ads";
import { requireAdmin } from "@/lib/session";
import { writeAudit } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Failed");

function revalidate() {
  revalidatePath("/admin/ads");
  revalidateTag("ads");
  revalidatePath("/", "layout");
}

export async function createAdAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = adSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    const ad = await createAd(parsed.data);
    await writeAudit({ actorId: user.id, action: "CREATE", entityType: "Advertisement", entityId: ad.id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updateAdAction(id: string, raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = adSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await updateAd(id, parsed.data);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "Advertisement", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function deleteAdAction(id: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    await deleteAd(id);
    await writeAudit({ actorId: user.id, action: "DELETE", entityType: "Advertisement", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
