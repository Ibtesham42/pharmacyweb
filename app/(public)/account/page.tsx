import Link from "next/link";
import { Download, Receipt, ShoppingBag, Clock, Package, Crown, Heart, Briefcase, Newspaper, MessageSquare } from "lucide-react";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { AccountLogoutButton } from "@/components/public/account-logout-button";
import { SavedResources } from "@/components/public/saved-resources";
import { ProfileForm } from "@/components/public/profile-form";
import { NotificationsPanel } from "@/components/public/notifications-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { requireBuyer } from "@/lib/buyer-session";
import { getCurrentUser } from "@/lib/session";
import { listBuyerPurchases } from "@/services/resource-purchases";
import { listBuyerBundlePurchases } from "@/services/bundle-purchases";
import { getMembershipByBuyer } from "@/services/memberships";
import { listBuyerDownloads } from "@/services/resources";
import { listBuyerBookmarks } from "@/services/resource-bookmarks";
import { listUserPostBookmarks } from "@/services/post-bookmarks";
import { listUserConversations } from "@/services/ai/chat";
import { listNotifications } from "@/services/notifications";
import { listDonationsByEmail } from "@/services/donations";
import { formatINR, formatDate, postPath } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "My account",
  path: "/account",
  description: "Your purchased and saved pharmacy resources.",
  noindex: true,
});

export default async function AccountPage() {
  const buyer = await requireBuyer("/account");
  const user = await getCurrentUser();
  const userId = user?.id ?? "";
  const [purchases, bundlePurchases, downloads, bookmarks, membership, donations, savedPosts, conversations, notifications] =
    await Promise.all([
      safe(listBuyerPurchases(buyer.id, buyer.email), []),
      safe(listBuyerBundlePurchases(buyer.id, buyer.email), []),
      safe(listBuyerDownloads(buyer.id, buyer.email), []),
      safe(listBuyerBookmarks(buyer.id), []),
      safe(getMembershipByBuyer(buyer.id), null),
      safe(listDonationsByEmail(buyer.email), []),
      userId ? safe(listUserPostBookmarks(userId), []) : Promise.resolve([]),
      userId ? safe(listUserConversations(userId), []) : Promise.resolve([]),
      userId ? safe(listNotifications(userId), []) : Promise.resolve([]),
    ]);
  const purchaseCount = purchases.length + bundlePurchases.length;
  const isMember = Boolean(membership && membership.expiresAt > new Date());
  const savedJobs = savedPosts.filter((p) => p.type === "JOB");
  const savedArticles = savedPosts.filter((p) => p.type !== "JOB");
  const unreadNotifications = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="container max-w-4xl py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "My account", path: "/account" }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">My account</h1>
          <p className="text-sm text-muted-foreground">{buyer.name ? `${buyer.name} · ` : ""}{buyer.email}</p>
        </div>
        <AccountLogoutButton />
      </div>

      <Card className="mt-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <Crown className={isMember ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"} />
            <div>
              <p className="text-sm font-medium">{isMember ? "PREMIUM member" : "Not a PREMIUM member"}</p>
              <p className="text-xs text-muted-foreground">
                {isMember && membership
                  ? `All-access until ${formatDate(membership.expiresAt)}`
                  : "Unlock every paid & premium resource with one pass."}
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant={isMember ? "outline" : "default"}>
            <Link href="/membership">{isMember ? "Extend" : "Go PREMIUM"}</Link>
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="purchases">Purchases{purchaseCount ? ` (${purchaseCount})` : ""}</TabsTrigger>
          <TabsTrigger value="saved">Saved{bookmarks.length ? ` (${bookmarks.length})` : ""}</TabsTrigger>
          <TabsTrigger value="jobs">Saved Jobs{savedJobs.length ? ` (${savedJobs.length})` : ""}</TabsTrigger>
          <TabsTrigger value="articles">Saved Articles{savedArticles.length ? ` (${savedArticles.length})` : ""}</TabsTrigger>
          <TabsTrigger value="downloads">Downloads{downloads.length ? ` (${downloads.length})` : ""}</TabsTrigger>
          <TabsTrigger value="chats">AI Chats{conversations.length ? ` (${conversations.length})` : ""}</TabsTrigger>
          <TabsTrigger value="donations">Donations{donations.length ? ` (${donations.length})` : ""}</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications{unreadNotifications ? ` (${unreadNotifications})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm name={buyer.name ?? ""} email={buyer.email} />
        </TabsContent>

        <TabsContent value="purchases" className="space-y-3">
          {purchaseCount === 0 && <Empty icon={ShoppingBag} text="No purchases yet." />}

          {bundlePurchases.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="flex items-center gap-1.5 font-medium">
                    <Package className="h-4 w-4 text-primary" /> {p.bundle.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bundle · {p.bundle._count.items} resources · {formatINR(p.amountPaise)} · {formatDate(p.paidAt)} · {p.receiptNo}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link href={`/exam-prep/${p.bundle.slug}`}>
                      <Download className="h-4 w-4" /> Open bundle
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/exam-prep/receipt/${p.id}`}>
                      <Receipt className="h-4 w-4" /> Receipt
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {purchases.length > 0 &&
            purchases.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{p.resource.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatINR(p.amountPaise)} · {formatDate(p.paidAt)} · {p.receiptNo}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <a href={`/api/resources/${p.resource.slug}/download`}>
                        <Download className="h-4 w-4" /> Download
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/store/receipt/${p.id}`}>
                        <Receipt className="h-4 w-4" /> Receipt
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="saved" className="space-y-3">
          <SavedResources initial={bookmarks} />
        </TabsContent>

        <TabsContent value="downloads" className="space-y-2">
          {downloads.length === 0 ? (
            <Empty icon={Clock} text="No downloads yet." />
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {downloads.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <Link href={`/store/${d.resource.slug}`} className="hover:underline">
                      {d.resource.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-2">
          <SavedPostList items={savedJobs} icon={Briefcase} emptyText="No saved jobs yet." />
        </TabsContent>

        <TabsContent value="articles" className="space-y-2">
          <SavedPostList items={savedArticles} icon={Newspaper} emptyText="No saved articles yet." />
        </TabsContent>

        <TabsContent value="chats" className="space-y-2">
          {conversations.length === 0 ? (
            <Empty icon={MessageSquare} text="No saved AI chats yet." />
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {conversations.map((c) => (
                  <Link
                    key={c.id}
                    href="/ai"
                    className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-accent/40"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {c.title || "Untitled chat"}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(c.updatedAt)}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsPanel initial={notifications} />
        </TabsContent>

        <TabsContent value="donations" className="space-y-2">
          {donations.length === 0 ? (
            <Empty icon={Heart} text="No donations yet." />
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {donations.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div>
                      <span className="font-medium">{formatINR(d.amountPaise)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(d.paidAt ?? d.createdAt)} · {d.receiptNo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={d.status === "PAID" ? "success" : "warning"}>{d.status}</Badge>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/donate/receipt/${d.id}`}>Receipt</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

type SavedPost = {
  id: string;
  title: string;
  slug: string;
  type: "JOB" | "NEWS" | "ARTICLE";
  excerpt: string | null;
  category: { name: string } | null;
};

function SavedPostList({
  items,
  icon: Icon,
  emptyText,
}: {
  items: SavedPost[];
  icon: React.ComponentType<{ className?: string }>;
  emptyText: string;
}) {
  if (items.length === 0) return <Empty icon={Icon} text={emptyText} />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4">
            <Link href={postPath(p.type, p.slug)} className="font-medium hover:underline">
              {p.title}
            </Link>
            {p.category && <p className="mt-0.5 text-xs text-muted-foreground">{p.category.name}</p>}
            {p.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <Button asChild variant="link" className="mt-1">
        <Link href="/store">Browse resources</Link>
      </Button>
    </div>
  );
}
