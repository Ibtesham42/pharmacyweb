import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ResourceAccess, ResourceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validation";
import { submitReview } from "@/services/resource-reviews";
import { hasEntitlement } from "@/services/resources";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`resource-review:${ip}`, 8, 60_000).success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const buyer = await getCurrentBuyer();
  if (!buyer) return NextResponse.json({ error: "Please sign in to review." }, { status: 401 });

  const { slug } = await params;
  const resource = await prisma.resource.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED, deletedAt: null },
    select: { id: true, access: true },
  });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse({ ...body, resourceId: resource.id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Only verified buyers: a PAID purchase, or (for free resources) a recorded download.
  let allowed = false;
  if (resource.access === ResourceAccess.PAID) {
    allowed = await hasEntitlement({ resourceId: resource.id, access: resource.access, buyerId: buyer.id, email: buyer.email });
  } else if (resource.access === ResourceAccess.FREE) {
    const dl = await prisma.resourceDownload.findFirst({
      where: { resourceId: resource.id, OR: [{ buyerId: buyer.id }, { email: buyer.email }] },
      select: { id: true },
    });
    allowed = Boolean(dl);
  }
  if (!allowed) {
    return NextResponse.json(
      { error: "Only verified buyers can review. Download or purchase this resource first." },
      { status: 403 },
    );
  }

  const settings = await getMarketplaceSettings();
  await submitReview({
    resourceId: resource.id,
    buyerId: buyer.id,
    rating: parsed.data.rating,
    title: parsed.data.title || undefined,
    body: parsed.data.body || undefined,
    autoApprove: !settings.reviewsRequireModeration,
  });

  return NextResponse.json({ ok: true, pending: settings.reviewsRequireModeration });
}
