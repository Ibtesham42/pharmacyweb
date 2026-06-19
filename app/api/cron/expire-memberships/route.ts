import { NextRequest, NextResponse } from "next/server";
import { expireStaleMemberships } from "@/services/memberships";

export const dynamic = "force-dynamic";

/**
 * Scheduled sweep: flip APPROVED-but-past-expiry memberships to EXPIRED.
 * Wired to Vercel Cron in `vercel.json`. Vercel automatically attaches
 * `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set in the project env,
 * so the endpoint refuses to run unless CRON_SECRET is configured AND matches —
 * it is never an open/unauthenticated mutation.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expired = await expireStaleMemberships();
  return NextResponse.json({ ok: true, expired });
}
