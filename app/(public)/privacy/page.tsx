import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  path: "/privacy",
  description: `Privacy policy for ${siteConfig.name}.`,
});

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Privacy Policy", path: "/privacy" }]} />
      <article className="prose-content mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>
          This Privacy Policy explains how {siteConfig.name} collects, uses and protects information
          when you use our website.
        </p>
        <h2>Information we collect</h2>
        <ul>
          <li>Contact details you provide (e.g. via the contact or newsletter forms).</li>
          <li>Anonymous usage analytics (pages viewed, searches) to improve the service.</li>
          <li>Standard server logs and cookies for security and functionality.</li>
        </ul>
        <h2>Advertising</h2>
        <p>
          We may display ads, including via Google AdSense. Third-party vendors, including Google,
          use cookies to serve ads based on prior visits. You can opt out of personalised
          advertising via Google Ads Settings.
        </p>
        <h2>How we use information</h2>
        <p>To operate the site, respond to enquiries, send updates you opt into, and improve content.</p>
        <h2>Your choices</h2>
        <p>
          You can unsubscribe from emails at any time and request deletion of contact data by writing
          to us via the <a href="/contact">contact page</a>.
        </p>
        <h2>Contact</h2>
        <p>Questions about this policy? Reach us through the contact page.</p>
      </article>
    </div>
  );
}
