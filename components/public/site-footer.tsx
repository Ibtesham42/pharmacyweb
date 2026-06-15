import Link from "next/link";
import { Pill } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { getDonationSettings } from "@/services/donations";
import { DEFAULT_DONATION_SETTINGS } from "@/lib/donations/config";
import { safe } from "@/lib/utils";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/jobs", label: "Jobs" },
      { href: "/articles", label: "Articles" },
      { href: "/news", label: "Medical News" },
      { href: "/categories", label: "Categories" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/advertise", label: "Advertise" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
];

export async function SiteFooter() {
  const donations = await safe(getDonationSettings(), DEFAULT_DONATION_SETTINGS);
  const donateEnabled = donations.enabled;

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Pill className="h-5 w-5" />
            </span>
            <span className="text-lg">{siteConfig.name}</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{siteConfig.description}</p>
          <div className="mt-4 max-w-sm">
            <NewsletterForm />
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-semibold">{col.title}</h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
              {col.title === "Company" && donateEnabled && (
                <li>
                  <Link href="/donate" className="text-sm font-medium text-primary hover:underline">
                    Support Us
                  </Link>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t py-6">
        <p className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved. Built for pharmacy &
          healthcare professionals in India.
        </p>
      </div>
    </footer>
  );
}
