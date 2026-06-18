import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { listNotifications, unreadNotificationCount } from "@/services/notifications";

export const dynamic = "force-dynamic";

/** Recent notifications + unread count for the signed-in user (powers the header bell). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [items, unread] = await Promise.all([
    listNotifications(user.id, 8),
    unreadNotificationCount(user.id),
  ]);

  return NextResponse.json({
    unread,
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      href: n.href,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  });
}
