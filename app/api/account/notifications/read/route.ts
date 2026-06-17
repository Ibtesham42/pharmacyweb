import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { markAllNotificationsRead } from "@/services/notifications";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
