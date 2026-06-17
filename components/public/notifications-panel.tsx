"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export interface NotificationView {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
}

export function NotificationsPanel({ initial }: { initial: NotificationView[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const unread = items.filter((n) => !n.readAt).length;

  async function markAll() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/notifications/read", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      toast.success("Marked all as read");
    } catch {
      toast.error("Could not update notifications");
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={markAll} disabled={busy}>
            <CheckCheck className="h-4 w-4" /> Mark all read ({unread})
          </Button>
        </div>
      )}
      <Card>
        <CardContent className="divide-y p-0">
          {items.map((n) => {
            const Inner = (
              <div className={`flex items-start gap-3 p-3 ${n.readAt ? "" : "bg-accent/30"}`}>
                <span className="mt-0.5">
                  {n.readAt ? (
                    <Check className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <span className="block h-2 w-2 rounded-full bg-primary" aria-label="unread" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(n.createdAt as Date)}</p>
                </div>
              </div>
            );
            return n.href ? (
              <Link key={n.id} href={n.href} className="block hover:bg-accent/40">
                {Inner}
              </Link>
            ) : (
              <div key={n.id}>{Inner}</div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
