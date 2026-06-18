"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus, ResourceStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/session";
import { bundleSchema } from "@/lib/validation";
import { createBundle, updateBundle, softDeleteBundle, setBundleStatus } from "@/services/bundles";
import { adminSetBundlePurchaseStatus, sendBundleReceiptEmail } from "@/services/bundle-purchases";
import { writeAudit } from "@/lib/audit";

type Result = { ok: true; id?: string } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function revalidate() {
  revalidatePath("/admin/resources/bundles");
  revalidatePath("/exam-prep");
  revalidatePath("/");
}

export async function createBundleAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = bundleSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    const bundle = await createBundle(parsed.data);
    await writeAudit({ actorId: user.id, action: "CREATE", entityType: "Bundle", entityId: bundle.id });
    revalidate();
    return { ok: true, id: bundle.id };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updateBundleAction(id: string, raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = bundleSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await updateBundle(id, parsed.data);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "Bundle", entityId: id });
    revalidate();
    revalidatePath(`/exam-prep/${parsed.data.slug || ""}`);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function setBundleStatusAction(id: string, status: ResourceStatus): Promise<Result> {
  try {
    const user = await requireAdmin();
    await setBundleStatus(id, status);
    await writeAudit({ actorId: user.id, action: "PUBLISH", entityType: "Bundle", entityId: id, after: { status } });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function deleteBundleAction(id: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    await softDeleteBundle(id);
    await writeAudit({ actorId: user.id, action: "DELETE", entityType: "Bundle", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function setBundlePurchaseStatusAction(id: string, status: OrderStatus): Promise<Result> {
  try {
    const user = await requireAdmin();
    // Email the receipt only on the FIRST transition to PAID.
    if (await adminSetBundlePurchaseStatus(id, status)) void sendBundleReceiptEmail(id);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "BundlePurchase", entityId: id, after: { status } });
    revalidatePath("/admin/resources/bundles/purchases");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
