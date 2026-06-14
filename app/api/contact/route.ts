import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { createContactMessage } from "@/services/contact";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60_000).success) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Honeypot: silently accept bots without storing.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  await createContactMessage(parsed.data);
  return NextResponse.json({ ok: true });
}
