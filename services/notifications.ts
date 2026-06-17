import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export interface NotificationInput {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string;
  href?: string;
}

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? NotificationType.SYSTEM,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
    },
  });
}

/**
 * Best-effort notification to the User account matching an email (no-op if there
 * is no account yet). Used by the purchase/membership flows, which key on email.
 */
export async function notifyByEmail(
  email: string,
  n: { type?: NotificationType; title: string; body?: string; href?: string },
) {
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
    if (!user) return;
    await createNotification({ userId: user.id, ...n });
  } catch {
    /* never block the caller on a notification */
  }
}

export function listNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function unreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}
