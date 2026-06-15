import { PostType } from "@prisma/client";

/** Public URL for a post based on its type. */
export function postPath(type: PostType, slug: string): string {
  switch (type) {
    case "JOB":
      return `/jobs/${slug}`;
    case "NEWS":
      return `/news/${slug}`;
    default:
      return `/articles/${slug}`;
  }
}

export function sectionForType(type: PostType): "jobs" | "news" | "articles" {
  return type === "JOB" ? "jobs" : type === "NEWS" ? "news" : "articles";
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return dateFmt.format(new Date(date));
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return formatDate(d);
}

export function formatSalary(
  min?: number | null,
  max?: number | null,
  text?: string | null,
): string | null {
  if (text) return text;
  const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;
  if (min && max) return `${inr(min)} – ${inr(max)} / year`;
  if (min) return `From ${inr(min)} / year`;
  if (max) return `Up to ${inr(max)} / year`;
  return null;
}

export const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  GOVERNMENT: "Government",
  TEMPORARY: "Temporary",
};

export function jobLocation(city?: string | null, state?: string | null): string {
  return [city, state].filter(Boolean).join(", ") || "India";
}

export function priceFromCents(cents: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(cents / 100);
}

/** Estimated reading time in whole minutes (≈200 wpm), minimum 1. */
export function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Format paise as a clean INR amount (no decimals), e.g. 100000 -> "₹1,000". */
export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
