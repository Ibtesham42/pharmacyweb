import { Prisma, Role, UserStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function listUsers(opts: { q?: string; role?: string; status?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const where: Prisma.UserWhereInput = {
    ...(opts.role && { role: opts.role as Role }),
    ...(opts.status && { status: opts.status as UserStatus }),
    ...(opts.q && {
      OR: [
        { email: { contains: opts.q, mode: "insensitive" } },
        { name: { contains: opts.q, mode: "insensitive" } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** A user + their cross-table activity (purchases/downloads/membership) for the admin detail view. */
export async function getUserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, createdAt: true },
  });
  if (!user) return null;
  const email = user.email.toLowerCase();
  const [resourcePurchases, bundlePurchases, membershipPurchases, downloads, membership, recentDownloads] =
    await Promise.all([
      prisma.resourcePurchase.count({ where: { email, status: OrderStatus.PAID } }),
      prisma.bundlePurchase.count({ where: { email, status: OrderStatus.PAID } }),
      prisma.membershipPurchase.count({ where: { email, status: OrderStatus.PAID } }),
      prisma.resourceDownload.count({ where: { email } }),
      prisma.membership.findFirst({ where: { buyer: { email } }, include: { plan: { select: { name: true } } } }),
      prisma.resourceDownload.findMany({
        where: { email },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, createdAt: true, resource: { select: { title: true, slug: true } } },
      }),
    ]);
  return {
    user,
    stats: { resourcePurchases, bundlePurchases, membershipPurchases, downloads },
    membership,
    recentDownloads,
  };
}

export async function setUserStatus(id: string, status: UserStatus) {
  return prisma.user.update({ where: { id }, data: { status } });
}

export async function activeMemberCountTotal(): Promise<number> {
  return prisma.membership.count({ where: { expiresAt: { gt: new Date() } } });
}
