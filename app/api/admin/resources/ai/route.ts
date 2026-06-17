import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resourceAiSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/session";
import { getAiSettings } from "@/services/ai/settings";
import { isGroqConfigured } from "@/lib/ai/groq";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import {
  generateExcerpt,
  generateSeo,
  suggestTags,
  generateMcqs,
  generateFlashcards,
  extractResourceFileText,
  type ResourceToolInput,
} from "@/services/ai/resource-tools";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Admin-only AI authoring assistant for marketplace resources. Generates an
 * excerpt, SEO metadata, tags, MCQs or flashcards from the resource's own
 * title + description text. The admin reviews/edits the output before publish
 * (nothing is auto-saved). Reuses the shared Groq provider + usage logging.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req.headers);
  if (!rateLimit(`resource-ai:${ip}`, 20, 60_000).success) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = resourceAiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { tool, title, type, text, fileId, useFile, count } = parsed.data;

  const settings = await getAiSettings();
  if (!settings.enabled || settings.maintenanceMode) {
    return NextResponse.json({ error: "The AI assistant is currently unavailable." }, { status: 503 });
  }
  if (!isGroqConfigured()) {
    return NextResponse.json({ error: "AI is not configured (missing GROQ_API_KEY)." }, { status: 503 });
  }

  // Source the AI from the attached PDF/DOCX/TXT when requested, else from the typed text.
  let source = text ?? "";
  if (useFile && fileId) {
    try {
      source = await extractResourceFileText(fileId);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not read the attached file." },
        { status: 400 },
      );
    }
  }

  const ctx = { ip };
  const input: ResourceToolInput = { title, type, text: source };

  try {
    switch (tool) {
      case "excerpt":
        return NextResponse.json(await generateExcerpt(ctx, input));
      case "seo":
        return NextResponse.json(await generateSeo(ctx, input));
      case "tags":
        return NextResponse.json(await suggestTags(ctx, input));
      case "mcqs":
        return NextResponse.json(await generateMcqs(ctx, input, count ?? 5));
      case "flashcards":
        return NextResponse.json(await generateFlashcards(ctx, input, count ?? 8));
      default:
        return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "The AI service failed. Please try again." }, { status: 502 });
  }
}
