"use server";

import { revalidatePath } from "next/cache";
import { PostStatus } from "@prisma/client";
import { postSchema } from "@/lib/validation";
import { createPost, updatePost, softDeletePost, setPostStatus } from "@/services/posts";
import { requireAdmin, UnauthorizedError } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { postPath } from "@/lib/format";

export type ActionResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

function revalidateAll(type?: "JOB" | "NEWS" | "ARTICLE", slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/posts");
  revalidatePath("/jobs");
  revalidatePath("/articles");
  revalidatePath("/news");
  if (type && slug) revalidatePath(postPath(type, slug));
}

function fail(err: unknown): ActionResult {
  if (err instanceof UnauthorizedError) return { ok: false, error: "Not authorized" };
  console.error("post action failed", err);
  return { ok: false, error: err instanceof Error ? err.message : "Something went wrong" };
}

export async function createPostAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const post = await createPost(parsed.data, user.id);
    await writeAudit({ actorId: user.id, action: "CREATE", entityType: "Post", entityId: post.id, after: { title: post.title, status: post.status } });
    revalidateAll(parsed.data.type, post.slug);
    return { ok: true, id: post.id, slug: post.slug };
  } catch (err) {
    return fail(err);
  }
}

export async function updatePostAction(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const post = await updatePost(id, parsed.data);
    await writeAudit({ actorId: user.id, action: "UPDATE", entityType: "Post", entityId: id, after: { title: post.title, status: post.status } });
    revalidateAll(parsed.data.type, post.slug);
    return { ok: true, id: post.id, slug: post.slug };
  } catch (err) {
    return fail(err);
  }
}

export async function deletePostAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireAdmin();
    await softDeletePost(id);
    await writeAudit({ actorId: user.id, action: "DELETE", entityType: "Post", entityId: id });
    revalidateAll();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function setPostStatusAction(
  id: string,
  status: PostStatus,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireAdmin();
    await setPostStatus(id, status);
    await writeAudit({ actorId: user.id, action: "PUBLISH", entityType: "Post", entityId: id, after: { status } });
    revalidateAll();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
