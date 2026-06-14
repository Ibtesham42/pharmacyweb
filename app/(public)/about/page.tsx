import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About Us",
  path: "/about",
  description: `About ${siteConfig.name} — our mission to connect pharmacy and medical professionals with careers and knowledge in India.`,
});

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <article className="prose-content mt-4">
        <h1 className="text-3xl font-bold tracking-tight">About {siteConfig.name}</h1>
        <p>
          {siteConfig.name} is a mobile-first platform helping pharmacy students, pharmacists,
          medical representatives and healthcare professionals across India discover jobs, medical
          news, articles and study material — all in one place.
        </p>
        <h2>What we offer</h2>
        <ul>
          <li>Curated pharmacy, medical and government healthcare job listings.</li>
          <li>Timely medical and pharmaceutical industry news.</li>
          <li>Career guides, articles and study material.</li>
          <li>A fast, search-first experience built for phones.</li>
        </ul>
        <h2>Our mission</h2>
        <p>
          To make healthcare career opportunities and trustworthy medical information accessible to
          everyone in the pharmacy and medical community.
        </p>
        <p>
          Have a suggestion or want to partner with us? Visit the{" "}
          <a href="/contact">contact page</a>.
        </p>
      </article>
    </div>
  );
}
