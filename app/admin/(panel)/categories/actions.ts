"use server";

import { revalidatePath } from "next/cache";
import { categorySchema } from "@/lib/validation";
import { createCategory, updateCategory, deleteCategory } from "@/services/categories";
import { requireAdmin } from "@/lib/session";
import { writeAudit } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function revalidate() {
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
}

export async function createCategoryAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = categorySchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    const cat = await createCategory(parsed.data);
    await writeAudit({ actorId: user.id, action: "CREATE", entityType: "Category", entityId: cat.id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updateCategoryAction(id: string, raw: unknown): Promise<Result> {
  try {
    const user = await requireAdmin();
    const parsed = categorySchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    await updateCategory(id, parsed.data);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "Category", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function deleteCategoryAction(id: string): Promise<Result> {
  try {
    const user = await requireAdmin();
    await deleteCategory(id);
    await writeAudit({ actorId: user.id, action: "DELETE", entityType: "Category", entityId: id });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
