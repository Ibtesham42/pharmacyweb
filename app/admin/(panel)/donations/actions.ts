"use server";

import { revalidatePath } from "next/cache";
import { DonationStatus, FeatureStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/session";
import { donationSettingsSchema, featureStatusSchema, featuredMessageSchema } from "@/lib/validation";
import {
  getDonationSettings,
  setDonationSettings,
  adminSetStatus,
  setFeatureStatus,
  setFeaturedMessage,
} from "@/services/donations";
import { writeAudit } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Failed");

export async function updateDonationSettingsAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = donationSettingsSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    const before = await getDonationSettings();
    await setDonationSettings({
      ...parsed.data,
      upiId: parsed.data.upiId || "",
      qrImageUrl: parsed.data.qrImageUrl || "",
    });
    await writeAudit({
      actorId: user.id,
      action: "UPDATE",
      entityType: "DonationSettings",
      before,
      after: parsed.data,
    });
    revalidatePath("/admin/donations");
    revalidatePath("/donate");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function setDonationStatusAction(id: string, status: DonationStatus): Promise<Result> {
  try {
    const user = await requireAdmin();
    await adminSetStatus(id, status);
    await writeAudit({
      actorId: user.id,
      action: "UPDATE",
      entityType: "Donation",
      entityId: id,
      after: { status },
    });
    revalidatePath("/admin/donations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function setFeatureStatusAction(id: string, status: FeatureStatus): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = featureStatusSchema.safeParse({ id, status });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await setFeatureStatus(parsed.data.id, parsed.data.status);
    await writeAudit({
      actorId: user.id,
      action: "UPDATE",
      entityType: "Donation",
      entityId: id,
      after: { featureStatus: status },
    });
    revalidatePath("/admin/donations");
    revalidatePath("/donate");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function setFeaturedMessageAction(id: string, message: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = featuredMessageSchema.safeParse({ id, message });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await setFeaturedMessage(parsed.data.id, parsed.data.message);
    await writeAudit({
      actorId: user.id,
      action: "UPDATE",
      entityType: "Donation",
      entityId: id,
      after: { featuredMessage: parsed.data.message },
    });
    revalidatePath("/admin/donations");
    revalidatePath("/donate");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
