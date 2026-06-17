import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

export function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

/** Link any pre-existing marketplace Buyer (e.g. earlier magic-link purchases) to this account. */
async function linkBuyer(userId: string, email: string) {
  await prisma.buyer
    .updateMany({ where: { email: email.toLowerCase(), userId: null }, data: { userId } })
    .catch(() => {});
}

/** Public signup → role USER. Bridges any existing Buyer with the same email. */
export async function createUser(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new Error("An account with this email already exists. Please sign in instead.");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { email, name: input.name, passwordHash, role: Role.USER },
  });
  await linkBuyer(user.id, email);
  return user;
}

/** Magic-link sign-in: ensure a USER exists for a verified email (no password set). */
export async function ensureUserForEmail(email: string, name?: string | null) {
  const normalized = email.toLowerCase();
  const user = await prisma.user.upsert({
    where: { email: normalized },
    update: name ? { name } : {},
    create: { email: normalized, name: name || normalized.split("@")[0], role: Role.USER },
  });
  await linkBuyer(user.id, normalized);
  return user;
}

/** Create a single-use reset token. Returns the RAW token (only the hash is stored), or null if no such user. */
export async function createPasswordReset(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  if (!user) return null; // caller shows a generic message either way (no account enumeration)
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  return token;
}

/** Consume a reset token and set the new password. Throws on invalid/expired/used token. */
export async function consumePasswordReset(token: string, newPassword: string) {
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.consumedAt || row.expiresAt < new Date()) {
    throw new Error("This reset link is invalid or has expired. Please request a new one.");
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
  ]);
}
