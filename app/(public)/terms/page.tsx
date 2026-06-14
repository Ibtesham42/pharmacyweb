import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms & Conditions",
  path: "/terms",
  description: `Terms and conditions for using ${siteConfig.name}.`,
});

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Terms & Conditions", path: "/terms" }]} />
      <article className="prose-content mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Terms &amp; Conditions</h1>
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>By using {siteConfig.name}, you agree to these terms.</p>
        <h2>Use of the site</h2>
        <p>
          Content is provided for general information. Job listings link to external application
          pages; we are not responsible for third-party sites or hiring decisions. Verify details
          with the employer before applying.
        </p>
        <h2>Content accuracy</h2>
        <p>
          We strive for accuracy but make no warranties about completeness or reliability of any
          content, including medical information, which is not professional advice.
        </p>
        <h2>Intellectual property</h2>
        <p>Content on this site may not be reproduced without permission.</p>
        <h2>Limitation of liability</h2>
        <p>
          {siteConfig.name} is not liable for any loss arising from use of the site or reliance on
          its content.
        </p>
        <h2>Changes</h2>
        <p>We may update these terms; continued use constitutes acceptance.</p>
      </article>
    </div>
  );
}
