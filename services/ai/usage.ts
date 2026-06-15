import { prisma } from "@/lib/prisma";
import { AiRequestStatus } from "@prisma/client";
import { startOfTodayUTC } from "./chat";

export interface AiUsageStats {
  totalRequests: number;
  dailyRequests: number;
  activeUsers: number; // distinct clientId today
  tokenUsage: number; // prompt + completion, all time
  apiErrors: number; // all-time error count
  avgResponseMs: number; // avg latency of successful requests
}

export async function getAiUsageStats(): Promise<AiUsageStats> {
  const since = startOfTodayUTC();
  const [total, daily, activeUsers, tokenAgg, errors, latencyAgg] = await Promise.all([
    prisma.aiRequestLog.count(),
    prisma.aiRequestLog.count({ where: { createdAt: { gte: since } } }),
    prisma.aiRequestLog.findMany({
      where: { createdAt: { gte: since }, clientId: { not: null } },
      distinct: ["clientId"],
      select: { clientId: true },
    }),
    prisma.aiRequestLog.aggregate({ _sum: { promptTokens: true, completionTokens: true } }),
    prisma.aiRequestLog.count({ where: { status: AiRequestStatus.ERROR } }),
    prisma.aiRequestLog.aggregate({
      _avg: { latencyMs: true },
      where: { status: AiRequestStatus.SUCCESS, latencyMs: { not: null } },
    }),
  ]);
  return {
    totalRequests: total,
    dailyRequests: daily,
    activeUsers: activeUsers.length,
    tokenUsage: (tokenAgg._sum.promptTokens ?? 0) + (tokenAgg._sum.completionTokens ?? 0),
    apiErrors: errors,
    avgResponseMs: Math.round(latencyAgg._avg.latencyMs ?? 0),
  };
}

/** Recent conversations for the admin "Conversations" tab. */
export async function listConversationLogs(limit = 50) {
  return prisma.aiConversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      clientId: true,
      title: true,
      mode: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
}

/** Recent error/blocked requests for the admin "Errors" tab. */
export async function listErrorLogs(limit = 50) {
  return prisma.aiRequestLog.findMany({
    where: { status: { not: AiRequestStatus.SUCCESS } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      model: true,
      mode: true,
      errorMessage: true,
      clientId: true,
      ip: true,
      createdAt: true,
    },
  });
}
