import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUserDetail } from "@/services/admin-users";
import { getCurrentUser } from "@/lib/session";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, admin] = await Promise.all([getUserDetail(id), getCurrentUser()]);
  if (!detail) notFound();

  const { user, stats, membership, recentDownloads } = detail;
  const isMember = Boolean(membership && membership.expiresAt > new Date());

  return (
    <div className="space-y-4">
      <Button asChild size="sm" variant="outline" className="w-fit">
        <Link href="/admin/users">
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <Badge variant={user.role === "ADMIN" ? "accent" : user.role === "EDITOR" ? "secondary" : "outline"}>
          {user.role}
        </Badge>
        <Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>{user.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{user.email}</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <Stat label="Resource buys" value={stats.resourcePurchases} />
              <Stat label="Bundle buys" value={stats.bundlePurchases} />
              <Stat label="Memberships" value={stats.membershipPurchases} />
              <Stat label="Downloads" value={stats.downloads} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-2 text-sm font-semibold">Account</h3>
              <dl className="space-y-1 text-sm">
                <Row label="Joined" value={formatDate(user.createdAt)} />
                <Row label="Last login" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"} />
                <Row
                  label="PREMIUM"
                  value={
                    isMember && membership
                      ? `Active until ${formatDate(membership.expiresAt)}${membership.plan ? ` (${membership.plan.name})` : ""}`
                      : "None"
                  }
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-2 text-sm font-semibold">Recent downloads</h3>
              {recentDownloads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No downloads yet.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {recentDownloads.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="truncate">{d.resource.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(d.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardContent className="p-5">
              <UserAdminActions
                id={user.id}
                status={user.status}
                isAdmin={user.role === "ADMIN"}
                isSelf={admin?.id === user.id}
                isMember={isMember}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
