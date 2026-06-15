"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { aiSettingsSchema } from "@/lib/validation";
import { getAiSettings, setAiSettings } from "@/services/ai/settings";
import { writeAudit } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Failed");

export async function updateAiSettingsAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = aiSettingsSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    const before = await getAiSettings();
    await setAiSettings(parsed.data);
    await writeAudit({
      actorId: user.id,
      action: "UPDATE",
      entityType: "AiSettings",
      before,
      after: parsed.data,
    });
    revalidatePath("/admin/ai");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
