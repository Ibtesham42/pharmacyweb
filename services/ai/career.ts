import { generateObject, generateText } from "ai";
import { AiMode, AiRequestStatus, PostType } from "@prisma/client";
import { z } from "zod";
import { groq } from "@/lib/ai/groq";
import { getAiSettings } from "@/services/ai/settings";
import { recordAssistantResult } from "@/services/ai/chat";
import { listPosts, getLatest } from "@/services/posts";
import { listPublicCategories } from "@/services/categories";
import {
  resumeResultSchema,
  jobMatchResultSchema,
  interviewResultSchema,
  learningResultSchema,
  resumePrompt,
  jobMatchPrompt,
  interviewPrompt,
  recommendPrompt,
  type ResumeResult,
  type JobMatchResult,
  type InterviewResult,
  type LearningResult,
} from "@/lib/ai/career";

export type CareerResult<T> = { object: T } | { fallbackMarkdown: string };

type Ctx = { clientId: string; ip?: string };

async function logUsage(p: {
  clientId: string;
  ip?: string;
  feature: string;
  model: string;
  status: AiRequestStatus;
  started: number;
  usage?: { inputTokens?: number; outputTokens?: number };
  error?: string;
}) {
  await recordAssistantResult({
    clientId: p.clientId,
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
): Promise<CareerResult<T>> {
  const settings = await getAiSettings();
  const model = groq(settings.model);
  const started = Date.now();
  try {
    const { object, usage } = await generateObject({ model, schema, prompt, temperature: 0.3 });
    await logUsage({ clientId: ctx.clientId, ip: ctx.ip, feature, model: settings.model, status: AiRequestStatus.SUCCESS, started, usage });
    return { object };
  } catch {
    try {
      const { text, usage } = await generateText({
        model,
        prompt: `${prompt}\n\nReturn your answer in clear, well-structured Markdown.`,
        temperature: 0.3,
      });
      await logUsage({ clientId: ctx.clientId, ip: ctx.ip, feature, model: settings.model, status: AiRequestStatus.SUCCESS, started, usage });
      return { fallbackMarkdown: text };
    } catch (err) {
      await logUsage({
        clientId: ctx.clientId,
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

export function analyzeResume(ctx: Ctx, resumeText: string): Promise<CareerResult<ResumeResult>> {
  return structured(ctx, "RESUME", resumeResultSchema, resumePrompt(resumeText));
}

export async function matchJobs(ctx: Ctx, resumeText: string): Promise<CareerResult<JobMatchResult>> {
  const { items } = await listPosts({ type: PostType.JOB, perPage: 15 });
  const jobs = items.map((p) => ({
    slug: p.slug,
    title: p.title,
    company: p.jobDetail?.companyName ?? "",
    location: [p.jobDetail?.city, p.jobDetail?.state].filter(Boolean).join(", "),
    qualifications: p.jobDetail?.qualifications ?? "",
    excerpt: p.excerpt ?? "",
  }));
  if (!jobs.length) {
    return { object: { overall: "No job listings are available right now.", matches: [] } };
  }
  const result = await structured<JobMatchResult>(
    ctx,
    "JOB_MATCH",
    jobMatchResultSchema,
    jobMatchPrompt(resumeText, jobs),
  );
  if ("object" in result) {
    const valid = new Set(jobs.map((j) => j.slug));
    result.object.matches = result.object.matches
      .filter((m) => valid.has(m.slug))
      .sort((a, b) => b.matchPercent - a.matchPercent);
  }
  return result;
}

export function interviewQuestions(
  ctx: Ctx,
  role: string,
  jobContext?: string,
): Promise<CareerResult<InterviewResult>> {
  return structured(ctx, "INTERVIEW", interviewResultSchema, interviewPrompt(role, jobContext));
}

export async function recommendLearning(
  ctx: Ctx,
  goal: string,
  resumeText?: string,
): Promise<CareerResult<LearningResult>> {
  const [articles, news, categories] = await Promise.all([
    getLatest(PostType.ARTICLE, 20),
    getLatest(PostType.NEWS, 8),
    listPublicCategories(),
  ]);
  const posts = [...articles, ...news].map((p) => ({ slug: p.slug, title: p.title }));
  const result = await structured<LearningResult>(
    ctx,
    "LEARN",
    learningResultSchema,
    recommendPrompt(goal, posts, categories.map((c) => c.name), resumeText),
  );
  if ("object" in result) {
    const valid = new Set(posts.map((p) => p.slug));
    result.object.posts = result.object.posts.filter((p) => !p.slug || valid.has(p.slug));
  }
  return result;
}
