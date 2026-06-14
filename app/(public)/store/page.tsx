import { ShoppingBag } from "lucide-react";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Store — Coming Soon",
  path: "/store",
  description: "Paid study PDFs and resources for pharmacy and medical exams — coming soon.",
  noindex: true,
});

export default function StorePage() {
  return (
    <div className="container max-w-2xl py-16 text-center">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Store", path: "/store" }]} />
      <ShoppingBag className="mx-auto mt-8 h-12 w-12 text-primary" />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Store — Coming Soon</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        We're building a store for premium study PDFs and exam resources. Subscribe to our newsletter
        to be notified when it launches.
      </p>
    </div>
  );
}
