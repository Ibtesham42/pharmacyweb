import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ResourceAccess } from "@prisma/client";
import {
  getResourceWithFile,
  hasEntitlement,
  recordDownload,
  incrementDownload,
} from "@/services/resources";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { verifyDownloadToken } from "@/lib/download-token";
import { signedDownloadUrl } from "@/lib/cloudinary";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Secure delivery: verifies entitlement (session buyer OR signed token), then
 * 302-redirects to a freshly-signed, ~90s-expiring Cloudinary URL. The storage
 * URL is never exposed and links cannot be reshared past the TTL.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`resource-download:${ip}`, 30, 60_000).success) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }
  const { slug } = await params;
  const { searchParams } = new URL(req.url);

  const resource = await getResourceWithFile(slug);
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
  if (!resource.file?.publicId) {
    return NextResponse.json({ error: "No file is attached to this resource yet." }, { status: 404 });
  }

  // Resolve buyer identity from the session or a signed download token.
  const buyer = await getCurrentBuyer();
  const token = verifyDownloadToken(searchParams.get("token"));
  if (token && token.resourceId !== resource.id) {
    return NextResponse.json({ error: "Invalid download link" }, { status: 403 });
  }
  const buyerId = buyer?.id ?? token?.buyerId ?? null;
  const email = buyer?.email ?? token?.email ?? null;

  const settings = await getMarketplaceSettings();
  const loginUrl = new URL(`/account/login?next=${encodeURIComponent(`/store/${slug}`)}`, req.url);

  // Free resources may optionally require a verified account.
  if (resource.access === ResourceAccess.FREE) {
    if (settings.freeRequiresAccount && !buyerId && !email) {
      return NextResponse.redirect(loginUrl);
    }
  } else {
    if (!buyerId && !email) return NextResponse.redirect(loginUrl);
  }

  const entitled = await hasEntitlement({
    resourceId: resource.id,
    access: resource.access,
    buyerId,
    email,
  });
  if (!entitled) {
    // Signed in but hasn't purchased → send to the resource page to buy.
    return NextResponse.redirect(new URL(`/store/${slug}?buy=1`, req.url));
  }

  await recordDownload({ resourceId: resource.id, buyerId, email, ip });
  void incrementDownload(resource.id);

  const url = signedDownloadUrl(resource.file.publicId, { expiresInSec: 90 });
  return NextResponse.redirect(url);
}
