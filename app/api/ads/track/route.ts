import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trackImpression, trackClick } from "@/services/ads";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const schema = z.object({
  id: z.string().min(1).max(40),
  action: z.enum(["impression", "click"]),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`adtrack:${ip}`, 120, 60_000).success) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  if (parsed.data.action === "impression") await trackImpression(parsed.data.id);
  else await trackClick(parsed.data.id);

  return NextResponse.json({ ok: true });
}
