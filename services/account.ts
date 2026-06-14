import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function getAccount(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, lastLoginAt: true },
  });
}

/** Update the admin's name and login email. Enforces email uniqueness. */
export async function updateProfile(userId: string, data: { name: string; email: string }) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing && existing.id !== userId) {
    throw new Error("That email is already in use");
  }
  return prisma.user.update({
    where: { id: userId },
    data: { name: data.name, email: data.email },
  });
}

/** Change password after verifying the current one (defends against session misuse). */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
