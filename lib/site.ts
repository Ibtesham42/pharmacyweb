/** Central site configuration, read from env with sensible defaults. */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "PharmaCareers",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  description:
    "Find pharmacy jobs, medical news, and healthcare careers across India. Government and private pharmacist, medical representative, and healthcare openings, plus study material and industry articles.",
  locale: "en_IN",
  currency: "INR",
  twitter: "@pharmacareers",
  keywords: [
    "pharmacy jobs",
    "pharmacist jobs",
    "medical jobs",
    "healthcare careers",
    "government pharmacy vacancy",
    "pharma company jobs",
    "medical news",
    "pharmacy study material",
  ],
} as const;

export type SiteConfig = typeof siteConfig;

/** Absolute URL helper for canonical/OG/sitemap usage. */
export function absoluteUrl(path = "/"): string {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
