import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { PageViewTracker } from "@/components/public/page-view-tracker";
import { BackToTop } from "@/components/public/back-to-top";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { listPublicCategories } from "@/services/categories";
import { safe } from "@/lib/utils";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await safe(listPublicCategories(), []);
  const navCategories = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <SiteHeader categories={navCategories} />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
      <BackToTop />
      <PageViewTracker />
    </>
  );
}
