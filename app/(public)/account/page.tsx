import Link from "next/link";
import { Download, Receipt, Bookmark, ShoppingBag, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { AccountLogoutButton } from "@/components/public/account-logout-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { requireBuyer } from "@/lib/buyer-session";
import { listBuyerPurchases } from "@/services/resource-purchases";
import { listBuyerDownloads } from "@/services/resources";
import { listBuyerBookmarks } from "@/services/resource-bookmarks";
import { formatINR, formatDate } from "@/lib/format";
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
  const [purchases, downloads, bookmarks] = await Promise.all([
    safe(listBuyerPurchases(buyer.id, buyer.email), []),
    safe(listBuyerDownloads(buyer.id, buyer.email), []),
    safe(listBuyerBookmarks(buyer.id), []),
  ]);

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

      <Tabs defaultValue="purchases" className="mt-6">
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-3">
          {purchases.length === 0 ? (
            <Empty icon={ShoppingBag} text="No purchases yet." />
          ) : (
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
            ))
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-3">
          {bookmarks.length === 0 ? (
            <Empty icon={Bookmark} text="No saved resources yet." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {bookmarks.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <Link href={`/store/${r.slug}`} className="font-medium hover:underline">
                      {r.title}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {r.access === "FREE" ? "Free" : formatINR(r.pricePaise)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
      </Tabs>
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
