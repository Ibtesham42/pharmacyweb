import { prisma } from "@/lib/prisma";

/** List a browser's own conversations (anonymous, keyed by clientId). */
export async function listConversationsForClient(clientId: string, limit = 30) {
  return prisma.aiConversation.findMany({
    where: { clientId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, title: true, mode: true, updatedAt: true },
  });
}

export async function getConversationForClient(id: string, clientId: string) {
  return prisma.aiConversation.findFirst({
    where: { id, clientId },
    select: {
      id: true,
      title: true,
      mode: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });
}

/** Delete one conversation if it belongs to this client. Returns true if removed. */
export async function deleteConversation(id: string, clientId: string): Promise<boolean> {
  const res = await prisma.aiConversation.deleteMany({ where: { id, clientId } });
  return res.count > 0;
}

/** Clear all of a client's conversations. Returns count removed. */
export async function deleteAllConversations(clientId: string): Promise<number> {
  const res = await prisma.aiConversation.deleteMany({ where: { clientId } });
  return res.count;
}
