import { generateObject, generateText } from "ai";
import { AiMode, AiRequestStatus } from "@prisma/client";
import { z } from "zod";
import { groq } from "@/lib/ai/groq";
import { getAiSettings } from "@/services/ai/settings";
import { recordAssistantResult } from "@/services/ai/chat";
import {
  excerptResultSchema,
  seoResultSchema,
  tagsResultSchema,
  mcqResultSchema,
  flashcardResultSchema,
  excerptPrompt,
  seoPrompt,
  tagsPrompt,
  mcqPrompt,
  flashcardPrompt,
  type ExcerptResult,
  type SeoResult,
  type TagsResult,
  type McqResult,
  type FlashcardResult,
} from "@/lib/ai/resource-tools";

export type ResourceToolResult<T> = { object: T } | { fallbackMarkdown: string };

export interface ResourceToolInput {
  title: string;
  type?: string;
  text: string;
}

type Ctx = { ip?: string };

async function logUsage(p: {
  ip?: string;
  feature: string;
  model: string;
  status: AiRequestStatus;
  started: number;
  usage?: { inputTokens?: number; outputTokens?: number };
  error?: string;
}) {
  await recordAssistantResult({
    clientId: "admin",
    ip: p.ip,
    mode: AiMode.GENERAL,
    model: p.model,
    content: "",
    status: p.status,
    feature: p.feature,
    promptTokens: p.usage?.inputTokens,
    completionTokens: p.usage?.outputTokens,
    latencyMs: Date.now() - p.started,
    errorMessage: p.error,
  });
}

/** Run generateObject; on failure fall back to a markdown answer. Logs usage either way. */
async function structured<T>(
  ctx: Ctx,
  feature: string,
  schema: z.ZodType<T>,
  prompt: string,
): Promise<ResourceToolResult<T>> {
  const settings = await getAiSettings();
  const model = groq(settings.model);
  const started = Date.now();
  try {
    const { object, usage } = await generateObject({ model, schema, prompt, temperature: 0.3 });
    await logUsage({ ip: ctx.ip, feature, model: settings.model, status: AiRequestStatus.SUCCESS, started, usage });
    return { object };
  } catch {
    try {
      const { text, usage } = await generateText({
        model,
        prompt: `${prompt}\n\nReturn your answer in clear, well-structured Markdown.`,
        temperature: 0.3,
      });
      await logUsage({ ip: ctx.ip, feature, model: settings.model, status: AiRequestStatus.SUCCESS, started, usage });
      return { fallbackMarkdown: text };
    } catch (err) {
      await logUsage({
        ip: ctx.ip,
        feature,
        model: settings.model,
        status: AiRequestStatus.ERROR,
        started,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}

export function generateExcerpt(ctx: Ctx, input: ResourceToolInput): Promise<ResourceToolResult<ExcerptResult>> {
  return structured(ctx, "RESOURCE_EXCERPT", excerptResultSchema, excerptPrompt(input.title, input.type, input.text));
}

export function generateSeo(ctx: Ctx, input: ResourceToolInput): Promise<ResourceToolResult<SeoResult>> {
  return structured(ctx, "RESOURCE_SEO", seoResultSchema, seoPrompt(input.title, input.type, input.text));
}

export async function suggestTags(ctx: Ctx, input: ResourceToolInput): Promise<ResourceToolResult<TagsResult>> {
  const result = await structured<TagsResult>(
    ctx,
    "RESOURCE_TAGS",
    tagsResultSchema,
    tagsPrompt(input.title, input.type, input.text),
  );
  if ("object" in result) {
    // Normalise: lowercase, strip '#', de-dupe, cap at 10.
    const seen = new Set<string>();
    result.object.tags = result.object.tags
      .map((t) => t.replace(/^#/, "").trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length <= 40 && !seen.has(t) && (seen.add(t), true))
      .slice(0, 10);
  }
  return result;
}

export function generateMcqs(
  ctx: Ctx,
  input: ResourceToolInput,
  count = 5,
): Promise<ResourceToolResult<McqResult>> {
  return structured(ctx, "RESOURCE_MCQ", mcqResultSchema, mcqPrompt(input.title, input.type, input.text, count));
}

export function generateFlashcards(
  ctx: Ctx,
  input: ResourceToolInput,
  count = 8,
): Promise<ResourceToolResult<FlashcardResult>> {
  return structured(
    ctx,
    "RESOURCE_FLASHCARD",
    flashcardResultSchema,
    flashcardPrompt(input.title, input.type, input.text, count),
  );
}
