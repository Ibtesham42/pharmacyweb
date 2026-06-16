import { NextResponse } from "next/server";
import { clearBuyerSession } from "@/lib/buyer-session";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearBuyerSession();
  return NextResponse.json({ ok: true });
}
