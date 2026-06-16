// Marketplace configuration — shared, client-safe constants and types.
// No secrets here. Razorpay keys live only in env (server-side).
// Stored in SiteSetting key "marketplace" (JSON).

import type { ResourceType, ResourceAccess } from "@prisma/client";

export interface MarketplaceSettings {
  enabled: boolean;
  currency: string;
  /** UPI id + QR for the manual (UTR) fallback on paid resources. */
  upiId: string;
  qrImageUrl: string;
  featuredCount: number;
  reviewsRequireModeration: boolean;
  upiFallbackEnabled: boolean;
  /** PREMIUM tier is schema-only for now; show "coming soon" instead of selling. */
  premiumComingSoon: boolean;
  /** Require a verified buyer account even for FREE downloads. */
  freeRequiresAccount: boolean;
}

export const DEFAULT_MARKETPLACE_SETTINGS: MarketplaceSettings = {
  enabled: false,
  currency: "INR",
  upiId: "",
  qrImageUrl: "",
  featuredCount: 8,
  reviewsRequireModeration: true,
  upiFallbackEnabled: true,
  premiumComingSoon: true,
  freeRequiresAccount: false,
};

/** Sane upper cap to reject obviously bogus prices (₹50,000). */
export const RESOURCE_MAX_PAISE = 5_000_000;

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  PHARMACY_NOTES: "Pharmacy Notes",
  STUDY_GUIDE: "Study Guide",
  SYLLABUS: "Syllabus",
  PYQ: "Previous Year Questions",
  GPAT_MATERIAL: "GPAT Material",
  NIPER_MATERIAL: "NIPER Material",
  DRUG_INSPECTOR_MATERIAL: "Drug Inspector Material",
  RESEARCH_PAPER: "Research Paper",
  THESIS: "Thesis",
  PRESENTATION: "Presentation",
  EBOOK: "E-book",
  PDF_COLLECTION: "PDF Collection",
  MOCK_TEST: "Mock Test",
  QUESTION_BANK: "Question Bank",
  STUDY_PACKAGE: "Study Package",
};

export const RESOURCE_TYPES = Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[];

/** Types that belong in the (future) Thesis & Research library view. */
export const RESEARCH_TYPES: ResourceType[] = ["THESIS", "RESEARCH_PAPER"];

export const ACCESS_LABELS: Record<ResourceAccess, string> = {
  FREE: "Free",
  PAID: "Paid",
  PREMIUM: "Premium (members)",
};

/** Average rating from the denormalized sum/count (1 decimal, 0 when none). */
export function avgRating(ratingSum: number, ratingCount: number): number {
  if (!ratingCount) return 0;
  return Math.round((ratingSum / ratingCount) * 10) / 10;
}

/** Human-readable file size, e.g. 1048576 -> "1.0 MB". */
export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
