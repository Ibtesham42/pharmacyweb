import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buyerVerifySchema } from "@/lib/validation";
import { verifyLogin } from "@/services/buyers";
import { createBuyerSession } from "@/lib/buyer-session";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

function safeNext(next: string | null | undefined): string {
  // Only allow same-site relative paths to prevent open redirects.
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/account";
}

/** Magic-link click: verify token, set session, redirect. */
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  const { searchParams } = new URL(req.url);
  const next = safeNext(searchParams.get("next"));
  if (!rateLimit(`buyer-verify:${ip}`, 10, 60_000).success) {
    return NextResponse.redirect(new URL("/account/login?error=rate", req.url));
  }
  const token = searchParams.get("token") ?? undefined;
  const buyer = token ? await verifyLogin({ token }) : null;
  if (!buyer) {
    return NextResponse.redirect(new URL("/account/login?error=invalid", req.url));
  }
  await createBuyerSession({ id: buyer.id, email: buyer.email });
  return NextResponse.redirect(new URL(next, req.url));
}

/** Code entry from the login form: verify email+code (or token), set session. */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`buyer-verify:${ip}`, 10, 60_000).success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = buyerVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const buyer = await verifyLogin(parsed.data);
  if (!buyer) {
    return NextResponse.json({ error: "Invalid or expired code. Request a new link." }, { status: 400 });
  }
  await createBuyerSession({ id: buyer.id, email: buyer.email });
  return NextResponse.json({ ok: true });
}
