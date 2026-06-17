// Admin AI authoring tools for marketplace resources — structured-output
// schemas + prompt builders. Server-side, no secrets. Mirrors `lib/ai/career.ts`.
import { z } from "zod";

export const RESOURCE_AI_BASE = `You are an editorial assistant for an India-focused pharmacy & medical education marketplace.
Rules:
- Write for Indian pharmacy students and professionals (B.Pharm / D.Pharm / M.Pharm / Pharm D, GPAT, NIPER, Drug Inspector, etc.).
- Be accurate, neutral and concise. NEVER invent facts, statistics, citations, dosages or clinical claims that are not supported by the source material.
- This is educational study material — keep it exam-oriented and free of medical advice.`;

/** Trim the source to a token-safe length before prompting. */
export function clampSource(text: string, max = 16_000): string {
  return text.length > max ? text.slice(0, max) : text;
}

function header(title: string, type?: string): string {
  return `Resource title: "${title}"${type ? `\nResource type: ${type}` : ""}`;
}

// ── Excerpt / short summary ──
export const excerptResultSchema = z.object({
  excerpt: z.string().describe("A single plain-text sentence, 120–280 characters, no markdown."),
});
export type ExcerptResult = z.infer<typeof excerptResultSchema>;

export function excerptPrompt(title: string, type: string | undefined, text: string): string {
  return `${RESOURCE_AI_BASE}

Write one concise, compelling excerpt (120–280 characters, plain text, no markdown) that summarises this
resource for a storefront card. Describe what the learner gets and who it is for.

${header(title, type)}

Source:
"""
${clampSource(text)}
"""`;
}

// ── SEO meta ──
export const seoResultSchema = z.object({
  metaTitle: z.string().describe("≤ 60 characters, includes the key topic."),
  metaDescription: z.string().describe("140–160 characters, plain text."),
});
export type SeoResult = z.infer<typeof seoResultSchema>;

export function seoPrompt(title: string, type: string | undefined, text: string): string {
  return `${RESOURCE_AI_BASE}

Produce SEO metadata for this resource's store page. metaTitle ≤ 60 characters (compelling, keyword-rich,
India + pharmacy context). metaDescription 140–160 characters, plain text, no clickbait.

${header(title, type)}

Source:
"""
${clampSource(text)}
"""`;
}

// ── Tags ──
export const tagsResultSchema = z.object({
  tags: z.array(z.string()).describe("5–10 short lowercase tags/keywords, no '#'."),
});
export type TagsResult = z.infer<typeof tagsResultSchema>;

export function tagsPrompt(title: string, type: string | undefined, text: string): string {
  return `${RESOURCE_AI_BASE}

Suggest 5–10 concise, lowercase search tags/keywords for this resource (subjects, exams, level, topics).
No '#', no duplicates, no full sentences.

${header(title, type)}

Source:
"""
${clampSource(text)}
"""`;
}

// ── MCQs ──
export const mcqResultSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).describe("Exactly 4 options."),
      answerIndex: z.number().int().min(0).max(3).describe("0-based index of the correct option."),
      explanation: z.string().describe("One or two sentences on why the answer is correct."),
    }),
  ),
});
export type McqResult = z.infer<typeof mcqResultSchema>;

export function mcqPrompt(title: string, type: string | undefined, text: string, count: number): string {
  return `${RESOURCE_AI_BASE}

Create ${count} exam-style multiple-choice questions strictly grounded in the source material below.
Each question must have exactly 4 options, exactly one correct answer (give its 0-based index), and a brief
explanation. Do not ask about anything not present in the source.

${header(title, type)}

Source:
"""
${clampSource(text)}
"""`;
}

// ── Flashcards ──
export const flashcardResultSchema = z.object({
  cards: z.array(z.object({ front: z.string(), back: z.string() })),
});
export type FlashcardResult = z.infer<typeof flashcardResultSchema>;

export function flashcardPrompt(title: string, type: string | undefined, text: string, count: number): string {
  return `${RESOURCE_AI_BASE}

Create ${count} study flashcards from the source material below. Each card has a short "front" (a term,
concept or question) and a concise "back" (the definition / answer). Stay strictly within the source.

${header(title, type)}

Source:
"""
${clampSource(text)}
"""`;
}
