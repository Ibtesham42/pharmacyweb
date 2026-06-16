// Short-lived, HMAC-signed download tokens for emailed re-download links.
// Lets a buyer re-download a purchased resource from a link without a live
// session, while still being entitlement-bound and expiring. No new deps.

import crypto from "node:crypto";

function secret(): string {
  return (
    process.env.BUYER_AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-insecure-buyer-secret-change-me"
  );
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export interface DownloadTokenPayload {
  resourceId: string;
  buyerId?: string;
  email?: string;
}

export function signDownloadToken(data: DownloadTokenPayload, ttlSec = 60 * 60 * 24 * 7): string {
  const body = { ...data, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyDownloadToken(token: string | undefined | null): DownloadTokenPayload | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString()) as DownloadTokenPayload & { exp: number };
    if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    return { resourceId: body.resourceId, buyerId: body.buyerId, email: body.email };
  } catch {
    return null;
  }
}
