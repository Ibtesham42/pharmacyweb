import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAiSettings } from "@/services/ai/settings";
import { extractText } from "@/lib/ai/extract";
import { ACCEPTED_DOC_TYPES } from "@/lib/ai/config";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// Ephemeral: extract text from an uploaded document and return it. Nothing stored.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`ai-extract:${ip}`, 10, 60_000).success) {
    return NextResponse.json({ error: "Too many uploads. Please wait a minute." }, { status: 429 });
  }

  const settings = await getAiSettings();
  if (!settings.enabled || settings.maintenanceMode) {
    return NextResponse.json({ error: "The AI assistant is currently unavailable." }, { status: 503 });
  }
  if (!settings.documentAnalysisEnabled) {
    return NextResponse.json({ error: "Document analysis is disabled." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." }, { status: 415 });
  }
  if (file.size > settings.maxDocMB * 1024 * 1024) {
    return NextResponse.json({ error: `File too large (max ${settings.maxDocMB} MB).` }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, truncated } = await extractText(buffer, file.type);
    if (!text.trim()) {
      return NextResponse.json({ error: "Could not read any text from this file." }, { status: 422 });
    }
    return NextResponse.json({ name: file.name.slice(0, 200), text, truncated });
  } catch (err) {
    console.error("ai extract failed", err);
    return NextResponse.json({ error: "Failed to read the document." }, { status: 500 });
  }
}
