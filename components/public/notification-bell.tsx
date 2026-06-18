"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { formatDate } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * Header notification bell. Self-fetches the unread count + latest notifications
 * (so it is safe in the statically-rendered public layout), refreshes on open,
 * and marks all read via the existing POST /api/account/notifications/read.
 */
export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* ignore — the bell is best-effort */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAll() {
    if (busy || unread === 0) return;
    setBusy(true);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnread(0);
    try {
      await fetch("/api/account/notifications/read", { method: "POST" });
    } catch {
      /* optimistic — ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu onOpenChange={(o) => o && void load()}>
      <DropdownMenuTrigger
        aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-1.5rem)] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!loaded ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            items.map((n) => {
              const inner = (
                <div className={`flex items-start gap-2 px-3 py-2.5 ${n.readAt ? "" : "bg-accent/30"}`}>
                  {n.readAt ? (
                    <span className="block w-2 shrink-0" aria-hidden />
                  ) : (
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="unread" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    {n.body && <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</p>
                  </div>
                </div>
              );
              return n.href ? (
                <Link key={n.id} href={n.href} className="block border-b last:border-0 hover:bg-accent/40">
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className="border-b last:border-0">
                  {inner}
                </div>
              );
            })
          )}
        </div>

        <Link
          href="/account"
          className="block border-t px-3 py-2 text-center text-xs font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
