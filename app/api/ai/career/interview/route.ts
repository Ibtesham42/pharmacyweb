import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { aiInterviewSchema } from "@/lib/validation";
import { getAiSettings } from "@/services/ai/settings";
import { checkLimits } from "@/services/ai/chat";
import { interviewQuestions } from "@/services/ai/career";
import { isGroqConfigured } from "@/lib/ai/groq";
import { clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const body = await req.json().catch(() => null);
  const parsed = aiInterviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { clientId, role, jobContext } = parsed.data;

  const settings = await getAiSettings();
  if (!settings.enabled || settings.maintenanceMode)
    return NextResponse.json({ error: "The AI assistant is currently unavailable." }, { status: 503 });
  if (!settings.careerToolsEnabled)
    return NextResponse.json({ error: "Career tools are currently disabled." }, { status: 403 });
  if (!isGroqConfigured())
    return NextResponse.json({ error: "AI is not configured." }, { status: 503 });

  const limit = await checkLimits(clientId, ip, settings);
  if (!limit.ok) return NextResponse.json({ error: limit.reason }, { status: 429 });

  try {
    return NextResponse.json(await interviewQuestions({ clientId, ip }, role, jobContext));
  } catch {
    return NextResponse.json({ error: "The AI service failed. Please try again." }, { status: 502 });
  }
}
