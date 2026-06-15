// Career Copilot — structured-output schemas + prompt builders. Server-side.
import { z } from "zod";

export const CAREER_BASE = `You are the Pharmacy & Healthcare Career Copilot for users in India.
Rules:
- Be honest, specific, and practical. NEVER fabricate experience, employers, qualifications, or facts.
- This is educational career guidance only — encourage verifying details with official sources/employers.
- Use the Indian context (B.Pharm / D.Pharm / M.Pharm, GPAT, state pharmacy council registration, INR salaries, roles like pharmacist, medical representative, hospital/clinical pharmacist).
- Be concise and structured.`;

// ── Résumé analysis ──
export const resumeResultSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  missingSkills: z.array(z.string()),
  improvements: z.array(z.string()),
  atsTips: z.array(z.string()),
});
export type ResumeResult = z.infer<typeof resumeResultSchema>;

export function resumePrompt(resumeText: string): string {
  return `${CAREER_BASE}

Analyze this résumé for pharmacy/healthcare roles. Provide an honest ATS-style score (0-100), a short
summary, concrete strengths, missing skills/keywords, specific improvements, and ATS formatting tips.

Résumé:
"""
${resumeText}
"""`;
}

// ── Job matching ──
export const jobMatchResultSchema = z.object({
  overall: z.string(),
  matches: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      company: z.string(),
      matchPercent: z.number().min(0).max(100),
      missingSkills: z.array(z.string()),
      why: z.string(),
    }),
  ),
});
export type JobMatchResult = z.infer<typeof jobMatchResultSchema>;

export type JobContext = {
  slug: string;
  title: string;
  company: string;
  location: string;
  qualifications: string;
  excerpt: string;
};

export function jobMatchPrompt(resumeText: string, jobs: JobContext[]): string {
  const list = jobs
    .map(
      (j, i) =>
        `${i + 1}. slug=${j.slug} | ${j.title} @ ${j.company} | ${j.location} | qualifications: ${j.qualifications} | ${j.excerpt}`,
    )
    .join("\n");
  return `${CAREER_BASE}

Compare the résumé to these job listings. Return the best matches only (skip poor fits), each with a
realistic matchPercent (0-100), the candidate's missing skills for it, and a one-line reason. You MUST
use the exact slug provided for each job — do not invent slugs.

Résumé:
"""
${resumeText}
"""

Jobs:
${list}`;
}

// ── Interview prep ──
export const interviewResultSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      category: z.string(),
      answerOutline: z.string(),
    }),
  ),
});
export type InterviewResult = z.infer<typeof interviewResultSchema>;

export function interviewPrompt(role: string, jobContext?: string): string {
  return `${CAREER_BASE}

Generate a focused set of likely interview questions for the role: "${role}".${
    jobContext ? ` Context: ${jobContext}` : ""
  }
For each question give a category (Technical, Behavioral, Clinical, Situational, etc.) and a brief
answer outline (key points to cover — not a full scripted answer).`;
}

// ── Learning recommendations ──
export const learningResultSchema = z.object({
  focusAreas: z.array(z.string()),
  topics: z.array(z.object({ topic: z.string(), why: z.string() })),
  posts: z.array(z.object({ slug: z.string().optional(), title: z.string(), reason: z.string() })),
});
export type LearningResult = z.infer<typeof learningResultSchema>;

export function recommendPrompt(
  goal: string,
  posts: { slug: string; title: string }[],
  categories: string[],
  resumeText?: string,
): string {
  const list = posts.map((p) => `- slug=${p.slug} | ${p.title}`).join("\n");
  return `${CAREER_BASE}

The user's goal: "${goal}".${resumeText ? `\nRésumé (for context):\n"""\n${resumeText.slice(0, 8000)}\n"""` : ""}

Recommend a personalized learning path: key focus areas, specific topics (each with a short "why"),
and pick the most relevant of the site's articles below (use the exact slug). Only recommend articles
that genuinely fit. Site categories: ${categories.join(", ")}.

Articles:
${list}`;
}
