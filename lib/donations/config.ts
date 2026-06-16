// Donation configuration — shared, client-safe constants and types.
// No secrets here. Razorpay keys live only in env (server-side).

/** Configurable INR thresholds (in paise) that map a donation to a badge tier. */
export interface BadgeThresholds {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

export interface DonationSettings {
  enabled: boolean;
  title: string;
  message: string;
  pageContent: string;
  thankYouMessage: string;
  upiId: string;
  qrImageUrl: string;
  minAmountPaise: number;
  suggestedAmounts: number[]; // paise
  goalPaise: number;
  monthlyGoalPaise: number;
  // ── Featured Supporters ──
  featuredEnabled: boolean;
  featuredMaxShow: number;
  featuredOnHomepage: boolean;
  featuredOnDonatePage: boolean;
  badgeThresholds: BadgeThresholds; // paise
}

export const DEFAULT_BADGE_THRESHOLDS: BadgeThresholds = {
  bronze: 50_000, // ₹500
  silver: 200_000, // ₹2,000
  gold: 500_000, // ₹5,000
  platinum: 1_000_000, // ₹10,000
};

export const DEFAULT_DONATION_SETTINGS: DonationSettings = {
  enabled: false,
  title: "Support PharmaCareers",
  message:
    "Your support helps us keep pharmacy jobs, medical content, AI tools and learning resources free and growing.",
  pageContent:
    "Donations fund AI tool maintenance, pharmacy educational content, job-discovery resources, and future platform improvements. Every contribution — big or small — helps the community.",
  thankYouMessage: "Thank you for supporting our mission.",
  upiId: "",
  qrImageUrl: "",
  minAmountPaise: 1000, // ₹10
  suggestedAmounts: [1000, 2000, 5000, 10000, 20000, 50000, 100000],
  goalPaise: 0,
  monthlyGoalPaise: 0,
  featuredEnabled: false,
  featuredMaxShow: 12,
  featuredOnHomepage: true,
  featuredOnDonatePage: true,
  badgeThresholds: DEFAULT_BADGE_THRESHOLDS,
};

/** Sane upper cap to reject obviously bogus amounts (₹5,00,000). */
export const DONATION_MAX_PAISE = 50_000_000;

// ─────────────────────── Supporter levels / badges ───────────────────────

export type SupporterLevel = "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "SUPPORTER";

export interface SupporterLevelMeta {
  level: SupporterLevel;
  label: string;
  /** Tailwind classes for the badge chip (kept inline so it stays client-safe). */
  className: string;
}

export const SUPPORTER_LEVELS: Record<SupporterLevel, SupporterLevelMeta> = {
  PLATINUM: { level: "PLATINUM", label: "Platinum Supporter", className: "bg-slate-200 text-slate-800 border-slate-300" },
  GOLD: { level: "GOLD", label: "Gold Supporter", className: "bg-amber-100 text-amber-800 border-amber-200" },
  SILVER: { level: "SILVER", label: "Silver Supporter", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  BRONZE: { level: "BRONZE", label: "Bronze Supporter", className: "bg-orange-100 text-orange-800 border-orange-200" },
  SUPPORTER: { level: "SUPPORTER", label: "Supporter", className: "bg-teal-100 text-teal-800 border-teal-200" },
};

/** Map a donation amount (paise) to its badge tier using configurable thresholds. */
export function supporterLevelFor(
  amountPaise: number,
  thresholds: BadgeThresholds = DEFAULT_BADGE_THRESHOLDS,
): SupporterLevelMeta {
  if (amountPaise >= thresholds.platinum) return SUPPORTER_LEVELS.PLATINUM;
  if (amountPaise >= thresholds.gold) return SUPPORTER_LEVELS.GOLD;
  if (amountPaise >= thresholds.silver) return SUPPORTER_LEVELS.SILVER;
  if (amountPaise >= thresholds.bronze) return SUPPORTER_LEVELS.BRONZE;
  return SUPPORTER_LEVELS.SUPPORTER;
}

/** Safe public shape — NEVER includes email/phone/address/transaction details. */
export interface PublicSupporter {
  id: string;
  name: string; // already resolved to "Anonymous Supporter" when private
  level: SupporterLevel;
  levelLabel: string;
  levelClassName: string;
  message: string | null;
  date: string; // ISO; contribution date
}
