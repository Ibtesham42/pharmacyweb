import { Heart, Users, TrendingUp, Wallet, Star } from "lucide-react";
import {
  getDonationSettings,
  donationStats,
  listDonations,
  listSupporters,
  featuredAnalytics,
} from "@/services/donations";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { DonationSettingsForm } from "@/components/admin/donation-settings-form";
import { DonationsTable } from "@/components/admin/donations-table";
import { SupportersTable } from "@/components/admin/supporters-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { DEFAULT_DONATION_SETTINGS } from "@/lib/donations/config";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDonationsPage() {
  const [settings, stats, list, supporters, featured] = await Promise.all([
    safe(getDonationSettings(), DEFAULT_DONATION_SETTINGS),
    safe(donationStats(), {
      totalRaisedPaise: 0,
      paidCount: 0,
      totalCount: 0,
      donors: 0,
      avgPaise: 0,
      monthRaisedPaise: 0,
      conversion: 0,
      recent: [],
      topSupporters: [] as { name: string; total: number }[],
      bySource: [] as { source: string; total: number; count: number }[],
    }),
    safe(listDonations({}), { items: [], total: 0, page: 1, perPage: 25, pages: 1 }),
    safe(listSupporters({ tab: "all" }), { items: [], total: 0, page: 1, perPage: 25, pages: 1 }),
    safe(featuredAnalytics(), {
      totalFeatured: 0,
      pendingRequests: 0,
      byMonth: [] as { key: string; label: string; count: number }[],
      mostActive: [] as { name: string; total: number; donations: number }[],
    }),
  ]);
  const razorpayConfigured = isRazorpayConfigured();

  const cards = [
    { icon: Wallet, label: "Total raised", value: formatINR(stats.totalRaisedPaise) },
    { icon: Users, label: "Donors", value: String(stats.donors) },
    { icon: Heart, label: "This month", value: formatINR(stats.monthRaisedPaise) },
    { icon: TrendingUp, label: "Avg · conversion", value: `${formatINR(stats.avgPaise)} · ${stats.conversion}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Donations</h1>
          <p className="text-sm text-muted-foreground">Supporter contributions, settings and analytics.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/admin/donations/export">Export CSV</a>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="donors">
        <TabsList>
          <TabsTrigger value="donors">Donors</TabsTrigger>
          <TabsTrigger value="supporters">
            Supporters
            {featured.pendingRequests > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1 text-[11px] font-semibold text-amber-800">
                {featured.pendingRequests}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="donors">
          <DonationsTable donations={list.items} />
        </TabsContent>

        <TabsContent value="supporters" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat icon={Star} label="Featured supporters" value={String(featured.totalFeatured)} />
            <MiniStat icon={Heart} label="Pending requests" value={String(featured.pendingRequests)} />
          </div>
          <SupportersTable supporters={supporters.items} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold">Featured supporters by month</h3>
                {featured.byMonth.every((m) => m.count === 0) ? (
                  <p className="text-sm text-muted-foreground">No featured supporters yet.</p>
                ) : (
                  <div className="flex items-end gap-2" style={{ height: 80 }}>
                    {featured.byMonth.map((m) => {
                      const max = Math.max(1, ...featured.byMonth.map((x) => x.count));
                      return (
                        <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t bg-primary/70"
                            style={{ height: `${(m.count / max) * 56}px` }}
                            title={`${m.count}`}
                          />
                          <span className="text-[11px] text-muted-foreground">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 text-sm font-semibold">Most active supporters</h3>
                {featured.mostActive.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  featured.mostActive.map((t, i) => (
                    <div key={i} className="flex justify-between py-0.5 text-sm">
                      <span>
                        {t.name} <span className="text-xs text-muted-foreground">({t.donations})</span>
                      </span>
                      <span className="font-medium">{formatINR(t.total)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 text-sm font-semibold">Top supporters</h3>
                {stats.topSupporters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  stats.topSupporters.map((t, i) => (
                    <div key={i} className="flex justify-between py-0.5 text-sm">
                      <span>{t.name}</span>
                      <span className="font-medium">{formatINR(t.total)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 text-sm font-semibold">By source (most effective placements)</h3>
                {stats.bySource.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  stats.bySource.map((b, i) => (
                    <div key={i} className="flex justify-between py-0.5 text-sm">
                      <span>{b.source}</span>
                      <span className="font-medium">
                        {formatINR(b.total)} ({b.count})
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <DonationSettingsForm settings={settings} razorpayConfigured={razorpayConfigured} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
