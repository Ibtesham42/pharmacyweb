"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setSetting } from "@/services/settings";
import { requireAdmin } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Failed");

const homepageSchema = z.object({
  heroTitle: z.string().min(3).max(160),
  heroSubtitle: z.string().max(400),
  featuredCount: z.coerce.number().int().min(1).max(12),
});

const contactSchema = z.object({
  email: z.string().email().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
});

export async function updateHomepageAction(raw: unknown): Promise<Result> {
  try {
    await requireAdmin();
    const parsed = homepageSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await setSetting("homepage", parsed.data);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updateContactAction(raw: unknown): Promise<Result> {
  try {
    await requireAdmin();
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await setSetting("contact", parsed.data);
    revalidatePath("/contact");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
