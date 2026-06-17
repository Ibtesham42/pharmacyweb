import Link from "next/link";
import { Users, Crown } from "lucide-react";
import { listUsers, activeMemberCountTotal } from "@/services/admin-users";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["", "ACTIVE", "SUSPENDED"];
const ROLE_FILTERS = ["", "USER", "EDITOR", "ADMIN"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const [result, members] = await Promise.all([
    safe(listUsers({ q: sp.q, role: sp.role, status: sp.status, page: Number(sp.page ?? 1) }), {
      items: [],
      total: 0,
      page: 1,
      perPage: 25,
      pages: 1,
    }),
    safe(activeMemberCountTotal(), 0),
  ]);

  const buildHref = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    const merged = { q: sp.q ?? "", role: sp.role ?? "", status: sp.status ?? "", ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/users?${p.toString()}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold">{result.total}</p>
              <p className="text-xs text-muted-foreground">Total users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold">{members}</p>
              <p className="text-xs text-muted-foreground">Active members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {ROLE_FILTERS.map((r) => (
            <Link
              key={r || "all"}
              href={buildHref({ role: r, page: "" })}
              className={`rounded-md px-3 py-1 text-sm ${(sp.role ?? "") === r ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {r || "All roles"}
            </Link>
          ))}
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s || "any"}
              href={buildHref({ status: s, page: "" })}
              className={`rounded-md px-3 py-1 text-sm ${(sp.status ?? "") === s ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {s || "Any status"}
            </Link>
          ))}
        </div>
        <form className="ml-auto" action="/admin/users">
          {sp.role && <input type="hidden" name="role" value={sp.role} />}
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search name or email…"
            className="h-9 w-56 rounded-md border bg-background px-3 text-sm"
          />
        </form>
      </div>

      <Card className="overflow-hidden">
        {result.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Joined</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Last login</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                        {u.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "ADMIN" ? "accent" : u.role === "EDITOR" ? "secondary" : "outline"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.status === "ACTIVE" ? "success" : "warning"}>{u.status}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {result.pages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildHref({ page: String(n) })}
              className={`rounded-md px-3 py-1 text-sm ${n === result.page ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
