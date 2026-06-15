import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";
import { AiMode, AiRole, AiRequestStatus } from "@prisma/client";
import type { AiSettings } from "@/lib/ai/config";

/** Midnight (UTC) of the current day — daily-limit / "today" boundary. */
export function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export type LimitCheck = { ok: true } | { ok: false; reason: string };

/** Enforce burst (per-IP/min), per-user/day, and global/day limits. */
export async function checkLimits(
  clientId: string,
  ip: string,
  settings: AiSettings,
): Promise<LimitCheck> {
  if (!rateLimit(`ai:${ip}`, settings.perMinuteLimit, 60_000).success) {
    return { ok: false, reason: "Too many requests. Please wait a minute and try again." };
  }
  const since = startOfTodayUTC();
  const userToday = await prisma.aiRequestLog.count({
    where: { clientId, createdAt: { gte: since } },
  });
  if (userToday >= settings.perUserDailyLimit) {
    return { ok: false, reason: "You've reached today's AI usage limit. Please try again tomorrow." };
  }
  const globalToday = await prisma.aiRequestLog.count({ where: { createdAt: { gte: since } } });
  if (globalToday >= settings.dailyLimit) {
    return { ok: false, reason: "The AI assistant has reached today's overall limit. Please try again later." };
  }
  return { ok: true };
}

/** Append the latest user message, creating the conversation if needed. Returns conversationId. */
export async function recordUserMessage(params: {
  conversationId?: string;
  clientId: string;
  mode: AiMode;
  content: string;
}): Promise<string> {
  let conversationId = params.conversationId;
  if (conversationId) {
    const existing = await prisma.aiConversation.findFirst({
      where: { id: conversationId, clientId: params.clientId },
      select: { id: true },
    });
    if (!existing) conversationId = undefined;
  }
  if (!conversationId) {
    const convo = await prisma.aiConversation.create({
      data: { clientId: params.clientId, mode: params.mode, title: params.content.slice(0, 80) },
      select: { id: true },
    });
    conversationId = convo.id;
  } else {
    await prisma.aiConversation.update({
      where: { id: conversationId },
      data: { mode: params.mode },
    });
  }
  await prisma.aiMessage.create({
    data: { conversationId, role: AiRole.USER, content: params.content },
  });
  return conversationId;
}

/** Persist the assistant reply + write a usage log row. Best-effort (never throws). */
export async function recordAssistantResult(params: {
  conversationId?: string;
  clientId: string;
  ip?: string;
  mode: AiMode;
  model: string;
  content: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  status: AiRequestStatus;
  errorMessage?: string;
}): Promise<void> {
  try {
    if (params.conversationId && params.content && params.status === AiRequestStatus.SUCCESS) {
      await prisma.aiMessage.create({
        data: {
          conversationId: params.conversationId,
          role: AiRole.ASSISTANT,
          content: params.content,
          model: params.model,
          promptTokens: params.promptTokens,
          completionTokens: params.completionTokens,
        },
      });
    }
    await prisma.aiRequestLog.create({
      data: {
        clientId: params.clientId,
        conversationId: params.conversationId,
        feature: "CHAT",
        mode: params.mode,
        model: params.model,
        status: params.status,
        promptTokens: params.promptTokens ?? 0,
        completionTokens: params.completionTokens ?? 0,
        latencyMs: params.latencyMs,
        errorMessage: params.errorMessage?.slice(0, 500),
        ip: params.ip,
      },
    });
  } catch (err) {
    console.error("ai recordAssistantResult failed", err);
  }
}
