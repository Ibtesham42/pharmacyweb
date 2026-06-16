import type { Metadata } from "next";
import { siteConfig, absoluteUrl } from "@/lib/site";

interface BuildMetaArgs {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  keywords?: string[];
}

/** Build a Next.js Metadata object with canonical, OpenGraph and Twitter tags. */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noindex = false,
  publishedTime,
  modifiedTime,
  keywords,
}: BuildMetaArgs): Metadata {
  const url = absoluteUrl(path);
  const desc = description || siteConfig.description;
  // When no explicit image is given, omit it so the file-based default
  // (app/opengraph-image.tsx) is used automatically.
  const images = image ? [{ url: image, width: 1200, height: 630 }] : undefined;

  return {
    title,
    description: desc,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: {
      type,
      url,
      title: title || siteConfig.name,
      description: desc,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      ...(images && { images }),
      ...(type === "article" && {
        publishedTime: publishedTime?.toISOString(),
        modifiedTime: modifiedTime?.toISOString(),
      }),
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitter,
      title: title || siteConfig.name,
      description: desc,
      ...(image && { images: [image] }),
    },
  };
}

// ─────────────────────────── JSON-LD generators ───────────────────────────
type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.svg"),
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

interface JobLdInput {
  title: string;
  description: string;
  slug: string;
  publishedAt?: Date | null;
  job: {
    companyName: string;
    companyWebsite?: string | null;
    city?: string | null;
    state?: string | null;
    jobType: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    currency?: string;
    expiryDate?: Date | null;
    applyUrl: string;
  };
}

const JOB_TYPE_LD: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
  TEMPORARY: "TEMPORARY",
  GOVERNMENT: "FULL_TIME",
};

export function jobPostingJsonLd(p: JobLdInput): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: p.title,
    description: p.description,
    datePosted: (p.publishedAt ?? new Date()).toISOString(),
    employmentType: JOB_TYPE_LD[p.job.jobType] ?? "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: p.job.companyName,
      ...(p.job.companyWebsite && { sameAs: p.job.companyWebsite }),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: p.job.city || undefined,
        addressRegion: p.job.state || undefined,
        addressCountry: "IN",
      },
    },
    directApply: true,
    url: absoluteUrl(`/jobs/${p.slug}`),
  };
  if (p.job.expiryDate) ld.validThrough = p.job.expiryDate.toISOString();
  if (p.job.salaryMin || p.job.salaryMax) {
    ld.baseSalary = {
      "@type": "MonetaryAmount",
      currency: p.job.currency || "INR",
      value: {
        "@type": "QuantitativeValue",
        minValue: p.job.salaryMin || undefined,
        maxValue: p.job.salaryMax || undefined,
        unitText: "YEAR",
      },
    };
  }
  return ld;
}

interface ArticleLdInput {
  title: string;
  description: string;
  slug: string;
  section: "articles" | "news";
  image?: string | null;
  publishedAt?: Date | null;
  modifiedAt?: Date | null;
  authorName: string;
}

export function articleJsonLd(p: ArticleLdInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": p.section === "news" ? "NewsArticle" : "Article",
    headline: p.title,
    description: p.description,
    image: p.image ? [p.image] : undefined,
    datePublished: (p.publishedAt ?? new Date()).toISOString(),
    dateModified: (p.modifiedAt ?? p.publishedAt ?? new Date()).toISOString(),
    author: { "@type": "Person", name: p.authorName },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    },
    mainEntityOfPage: absoluteUrl(`/${p.section}/${p.slug}`),
  };
}

interface ResourceLdInput {
  title: string;
  description: string;
  slug: string;
  image?: string | null;
  pricePaise: number;
  isFree: boolean;
  ratingValue?: number;
  ratingCount?: number;
}

/** schema.org Product for a marketplace resource, with offers + rating. */
export function resourceJsonLd(p: ResourceLdInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description,
    image: p.image ? [p.image] : undefined,
    url: absoluteUrl(`/store/${p.slug}`),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      price: (p.pricePaise / 100).toFixed(2),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/store/${p.slug}`),
    },
    ...(p.ratingCount && p.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.ratingValue,
            reviewCount: p.ratingCount,
          },
        }
      : {}),
  };
}
