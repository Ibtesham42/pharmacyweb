import Link from "next/link";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Advertise With Us",
  path: "/advertise",
  description: `Reach pharmacy and healthcare professionals across India. Advertising and sponsorship options on ${siteConfig.name}.`,
});

export default function AdvertisePage() {
  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Advertise", path: "/advertise" }]} />
      <article className="prose-content mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Advertise With Us</h1>
        <p>
          {siteConfig.name} reaches a focused audience of pharmacy students, pharmacists, medical
          representatives and healthcare job seekers across India. Promote your brand, college,
          product or job openings to a relevant, engaged community.
        </p>
        <h2>Options</h2>
        <ul>
          <li><strong>Banner ads</strong> — homepage, listing and article placements.</li>
          <li><strong>Featured job listings</strong> — top placement and highlighting.</li>
          <li><strong>Sponsored posts</strong> — articles and announcements.</li>
          <li><strong>Newsletter sponsorship</strong> — reach subscribers directly.</li>
        </ul>
        <p>Tell us what you have in mind and we'll share rates and availability.</p>
      </article>
      <Button asChild className="mt-2">
        <Link href="/contact">Get in touch</Link>
      </Button>
    </div>
  );
}
