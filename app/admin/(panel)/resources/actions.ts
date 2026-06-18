"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus, ResourceStatus, ReviewStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/session";
import {
  resourceSchema,
  resourceCategorySchema,
  marketplaceSettingsSchema,
} from "@/lib/validation";
import {
  createResource,
  updateResource,
  softDeleteResource,
  setResourceStatus,
} from "@/services/resources";
import {
  createResourceCategory,
  updateResourceCategory,
  deleteResourceCategory,
} from "@/services/resource-categories";
import { adminSetPurchaseStatus, sendResourceReceiptEmail } from "@/services/resource-purchases";
import { moderateReview } from "@/services/resource-reviews";
import { setMarketplaceSettings } from "@/services/marketplace-settings";
import { writeAudit } from "@/lib/audit";

type Result = { ok: true; id?: string } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function revalidate() {
  revalidatePath("/admin/resources");
  revalidatePath("/store");
  revalidatePath("/");
}

// ── Resources ──
export async function createResourceAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = resourceSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    const resource = await createResource(parsed.data);
    await writeAudit({ actorId: user.id, action: "CREATE", entityType: "Resource", entityId: resource.id });
    revalidate();
    return { ok: true, id: resource.id };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updateResourceAction(id: string, raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = resourceSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await updateResource(id, parsed.data);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "Resource", entityId: id });
    revalidate();
    revalidatePath(`/store/${parsed.data.slug || ""}`);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function setResourceStatusAction(id: string, status: ResourceStatus): Promise<Result> {
  try {
    const user = await requireAdmin();
    await setResourceStatus(id, status);
    await writeAudit({ actorId: user.id, action: "PUBLISH", entityType: "Resource", entityId: id, after: { status } });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function deleteResourceAction(id: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    await softDeleteResource(id);
    await writeAudit({ actorId: user.id, action: "DELETE", entityType: "Resource", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

// ── Categories ──
export async function createResourceCategoryAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = resourceCategorySchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    const cat = await createResourceCategory(parsed.data);
    await writeAudit({ actorId: user.id, action: "CREATE", entityType: "ResourceCategory", entityId: cat.id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updateResourceCategoryAction(id: string, raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = resourceCategorySchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await updateResourceCategory(id, parsed.data);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "ResourceCategory", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function deleteResourceCategoryAction(id: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    await deleteResourceCategory(id);
    await writeAudit({ actorId: user.id, action: "DELETE", entityType: "ResourceCategory", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

// ── Purchases ──
export async function setPurchaseStatusAction(id: string, status: OrderStatus): Promise<Result> {
  try {
    const user = await requireAdmin();
    // Email the receipt only on the FIRST transition to PAID (a repeat click,
    // or a row already paid by the webhook, must not re-send).
    if (await adminSetPurchaseStatus(id, status)) void sendResourceReceiptEmail(id);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "ResourcePurchase", entityId: id, after: { status } });
    revalidatePath("/admin/resources/purchases");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

// ── Reviews ──
export async function moderateReviewAction(id: string, status: ReviewStatus): Promise<Result> {
  try {
    const user = await requireAdmin();
    await moderateReview(id, status);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "ResourceReview", entityId: id, after: { status } });
    revalidatePath("/admin/resources/reviews");
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

// ── Settings ──
export async function updateMarketplaceSettingsAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = marketplaceSettingsSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await setMarketplaceSettings({
      ...parsed.data,
      upiId: parsed.data.upiId || "",
      qrImageUrl: parsed.data.qrImageUrl || "",
    });
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "MarketplaceSettings" });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
