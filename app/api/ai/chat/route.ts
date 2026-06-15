import type { NextRequest } from "next/server";
import { streamText } from "ai";
import { AiRequestStatus } from "@prisma/client";
import { aiChatSchema } from "@/lib/validation";
import { getAiSettings } from "@/services/ai/settings";
import { checkLimits, recordUserMessage, recordAssistantResult } from "@/services/ai/chat";
import { groq, isGroqConfigured } from "@/lib/ai/groq";
import { buildSystemPrompt, detectEmergency, EMERGENCY_NOTICE } from "@/lib/ai/safety";
import { clientIp } from "@/lib/ratelimit";
import type { AiModeKey } from "@/lib/ai/config";

// Prisma persistence in onFinish requires the Node runtime (not edge).
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);

  const body = await req.json().catch(() => null);
  const parsed = aiChatSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }
  const { clientId, mode, conversationId, messages, language } = parsed.data;
  const modeKey = mode as AiModeKey;

  const settings = await getAiSettings();
  if (!settings.enabled) return jsonError("The AI assistant is currently disabled.", 503);
  if (settings.maintenanceMode)
    return jsonError("The AI assistant is under maintenance. Please try again later.", 503);
  if (!settings.modes[modeKey]) return jsonError("This AI mode is currently unavailable.", 403);
  if (!isGroqConfigured())
    return jsonError("AI is not configured. Please contact the administrator.", 503);

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") {
    return jsonError("The last message must be from the user.", 400);
  }

  const limit = await checkLimits(clientId, ip, settings);
  if (!limit.ok) return jsonError(limit.reason, 429);

  // Persist the user's message (creates the conversation if needed).
  const convoId = await recordUserMessage({ conversationId, clientId, mode, content: last.content });

  // Safety: possible emergencies get a fixed safe notice — never the model.
  if (detectEmergency(last.content)) {
    await recordAssistantResult({
      conversationId: convoId,
      clientId,
      ip,
      mode,
      model: settings.model,
      content: EMERGENCY_NOTICE,
      status: AiRequestStatus.BLOCKED,
    });
    return new Response(EMERGENCY_NOTICE, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Conversation-Id": convoId },
    });
  }

  const started = Date.now();
  const modelMessages = messages.map((m) =>
    m.role === "user"
      ? ({ role: "user", content: m.content } as const)
      : ({ role: "assistant", content: m.content } as const),
  );

  try {
    const result = streamText({
      model: groq(settings.model),
      system: buildSystemPrompt(modeKey, language),
      messages: modelMessages,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
      abortSignal: req.signal,
      onError: async ({ error }) => {
        await recordAssistantResult({
          conversationId: convoId,
          clientId,
          ip,
          mode,
          model: settings.model,
          content: "",
          status: AiRequestStatus.ERROR,
          errorMessage: error instanceof Error ? error.message : String(error),
          latencyMs: Date.now() - started,
        });
      },
      onFinish: async (event) => {
        await recordAssistantResult({
          conversationId: convoId,
          clientId,
          ip,
          mode,
          model: settings.model,
          content: event.text,
          promptTokens: event.usage.inputTokens,
          completionTokens: event.usage.outputTokens,
          latencyMs: Date.now() - started,
          status: AiRequestStatus.SUCCESS,
        });
      },
    });

    return result.toTextStreamResponse({ headers: { "X-Conversation-Id": convoId } });
  } catch (err) {
    await recordAssistantResult({
      conversationId: convoId,
      clientId,
      ip,
      mode,
      model: settings.model,
      content: "",
      status: AiRequestStatus.ERROR,
      errorMessage: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - started,
    });
    return jsonError("The AI service failed. Please try again.", 502);
  }
}
