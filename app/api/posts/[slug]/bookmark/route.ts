import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { togglePostBookmark, isPostBookmarked } from "@/services/post-bookmarks";

export const dynamic = "force-dynamic";

// Lightweight per-user state for the (statically rendered) save button to hydrate from.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ signedIn: false, bookmarked: false });
  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ signedIn: true, bookmarked: false });
  return NextResponse.json({ signedIn: true, bookmarked: await isPostBookmarked(user.id, post.id) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to save." }, { status: 401 });

  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await togglePostBookmark(user.id, post.id);
  return NextResponse.json(result);
}
