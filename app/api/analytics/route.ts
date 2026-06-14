import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventType } from "@prisma/client";
import { recordEvent } from "@/services/analytics";
import { incrementViewCount } from "@/services/posts";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const eventSchema = z.object({
  type: z.nativeEnum(EventType),
  path: z.string().max(300).optional(),
  postId: z.string().max(40).optional(),
  adId: z.string().max(40).optional(),
  referrer: z.string().max(300).optional(),
  sessionId: z.string().max(64).optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`analytics:${ip}`, 120, 60_000).success) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  void recordEvent({
    ...parsed.data,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  // Off-render view counting for ISR-cached detail pages.
  if (parsed.data.type === "POST_VIEW" && parsed.data.postId) {
    void incrementViewCount(parsed.data.postId);
  }

  return NextResponse.json({ ok: true });
}
