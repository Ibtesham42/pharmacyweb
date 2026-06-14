import { prisma } from "@/lib/prisma";
import type { ContactInput } from "@/lib/validation";

export async function createContactMessage(input: ContactInput) {
  return prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      subject: input.subject || null,
      message: input.message,
    },
  });
}

export async function listContactMessages(opts: { page?: number } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 20;
  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contactMessage.count(),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function markMessageHandled(id: string, handled: boolean) {
  return prisma.contactMessage.update({ where: { id }, data: { handled } });
}

export async function subscribe(email: string) {
  return prisma.subscriber.upsert({
    where: { email },
    update: { status: "ACTIVE" },
    create: { email },
  });
}
