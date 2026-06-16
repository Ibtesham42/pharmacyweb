// Lightweight passwordless buyer session — a signed, httpOnly cookie. Entirely
// separate from the admin NextAuth session (no overlap with /admin gating).
// Signed with Node crypto HMAC (no new deps), reusing a server secret.

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE = "pharma_buyer";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

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

export interface BuyerSession {
  id: string;
  email: string;
}

/** Encode + HMAC-sign a session token. */
export function encodeSession(data: BuyerSession, maxAgeSec = MAX_AGE_SEC): string {
  const body = { ...data, exp: Math.floor(Date.now() / 1000) + maxAgeSec };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Verify a token's signature + expiry; returns the session or null. */
export function verifyToken(token: string | undefined | null): BuyerSession | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString()) as BuyerSession & { exp: number };
    if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: body.id, email: body.email };
  } catch {
    return null;
  }
}

export async function createBuyerSession(buyer: BuyerSession): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(buyer), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearBuyerSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getBuyerSession(): Promise<BuyerSession | null> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}

/** Load the live Buyer row for the current session (or null). */
export async function getCurrentBuyer() {
  const session = await getBuyerSession();
  if (!session) return null;
  return prisma.buyer.findUnique({ where: { id: session.id } });
}

/** Server-component guard: redirect to login when no buyer is signed in. */
export async function requireBuyer(nextPath?: string) {
  const buyer = await getCurrentBuyer();
  if (!buyer) {
    redirect(`/account/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  }
  return buyer;
}
