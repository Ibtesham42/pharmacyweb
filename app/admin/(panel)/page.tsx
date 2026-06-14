import Link from "next/link";
import { FileText, Briefcase, Newspaper, BookOpen, Eye, MousePointerClick, TrendingUp } from "lucide-react";
import { getDashboardStats } from "@/services/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safe } from "@/lib/utils";
import { postPath } from "@/lib/format";

const FALLBACK = {
  totals: { posts: 0, jobs: 0, articles: 0, news: 0, activeJobs: 0 },
  pageViews30d: 0,
  mostViewed: [] as { id: string; title: string; slug: string; type: "JOB" | "NEWS" | "ARTICLE"; viewCount: number }[],
  topCategories: [] as { name: string; slug: string; count: number }[],
  recentSearches: [] as { query: string | null; count: number }[],
  ads: { impressions: 0, clicks: 0 },
};

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const stats = await safe(getDashboardStats(), FALLBACK);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your content and traffic.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={FileText} label="Total posts" value={stats.totals.posts} />
        <Stat icon={Briefcase} label="Jobs (active)" value={`${stats.totals.jobs} (${stats.totals.activeJobs})`} />
        <Stat icon={BookOpen} label="Articles" value={stats.totals.articles} />
        <Stat icon={Newspaper} label="News" value={stats.totals.news} />
        <Stat icon={Eye} label="Page views (30d)" value={stats.pageViews30d} />
        <Stat icon={MousePointerClick} label="Ad clicks" value={stats.ads.clicks} />
        <Stat icon={TrendingUp} label="Ad impressions" value={stats.ads.impressions} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most viewed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.mostViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              stats.mostViewed.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={postPath(p.type, p.slug)} target="_blank" className="line-clamp-1 hover:text-primary">
                    {p.title}
                  </Link>
                  <Badge variant="secondary">{p.viewCount}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              stats.topCategories.map((c) => (
                <div key={c.slug} className="flex items-center justify-between gap-2 text-sm">
                  <span className="line-clamp-1">{c.name}</span>
                  <Badge variant="secondary">{c.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No searches yet.</p>
            ) : (
              stats.recentSearches.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="line-clamp-1">{s.query}</span>
                  <Badge variant="secondary">{s.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
