import { NextRequest, NextResponse } from "next/server";
import { searchSchema } from "@/lib/validation";
import { searchPosts } from "@/services/search";
import { recordEvent } from "@/services/analytics";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`search:${ip}`, 30, 60_000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = searchSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const result = await searchPosts(parsed.data);

  if (parsed.data.q) {
    void recordEvent({ type: "SEARCH", query: parsed.data.q, path: "/search" });
  }

  return NextResponse.json(result);
}
