import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function getBuyerById(id: string) {
  return prisma.buyer.findUnique({ where: { id } });
}

export function getBuyerByEmail(email: string) {
  return prisma.buyer.findUnique({ where: { email: email.toLowerCase() } });
}

/** Ensure a Buyer row exists for an email (used when a purchase is created). */
export async function ensureBuyer(email: string, name?: string) {
  const normalized = email.toLowerCase();
  return prisma.buyer.upsert({
    where: { email: normalized },
    update: name ? { name } : {},
    create: { email: normalized, name: name || null },
  });
}

/**
 * Create a magic-link token + 6-digit OTP for an email. Returns the RAW token
 * and code (only the hashes are stored) so the caller can email them.
 */
export async function requestLoginLink(email: string, name?: string) {
  const normalized = email.toLowerCase();
  await prisma.buyer.upsert({
    where: { email: normalized },
    update: name ? { name } : {},
    create: { email: normalized, name: name || null },
  });

  const token = crypto.randomBytes(32).toString("base64url");
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.buyerAuthToken.create({
    data: {
      email: normalized,
      tokenHash: sha256(token),
      code: sha256(code),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return { token, code };
}

/** Verify a magic-link token OR an email+code; consumes it and returns the buyer. */
export async function verifyLogin(input: { token?: string; email?: string; code?: string }) {
  const now = new Date();
  let row = null as Awaited<ReturnType<typeof prisma.buyerAuthToken.findFirst>> | null;

  if (input.token) {
    row = await prisma.buyerAuthToken.findUnique({ where: { tokenHash: sha256(input.token) } });
  } else if (input.email && input.code) {
    row = await prisma.buyerAuthToken.findFirst({
      where: {
        email: input.email.toLowerCase(),
        code: sha256(input.code),
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!row || row.consumedAt || row.expiresAt < now) return null;

  await prisma.buyerAuthToken.update({ where: { id: row.id }, data: { consumedAt: now } });
  const buyer = await prisma.buyer.update({
    where: { email: row.email },
    data: { emailVerified: true, lastLoginAt: now },
  });
  return buyer;
}
