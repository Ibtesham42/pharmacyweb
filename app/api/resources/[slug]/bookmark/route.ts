import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ResourceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toggleBookmark } from "@/services/resource-bookmarks";
import { getCurrentBuyer } from "@/lib/buyer-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const buyer = await getCurrentBuyer();
  if (!buyer) return NextResponse.json({ error: "Please sign in to save resources." }, { status: 401 });

  const { slug } = await params;
  const resource = await prisma.resource.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED, deletedAt: null },
    select: { id: true },
  });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const result = await toggleBookmark(buyer.id, resource.id);
  return NextResponse.json(result);
}
