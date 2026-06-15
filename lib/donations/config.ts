// Donation configuration — shared, client-safe constants and types.
// No secrets here. Razorpay keys live only in env (server-side).

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
}

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
};

/** Sane upper cap to reject obviously bogus amounts (₹5,00,000). */
export const DONATION_MAX_PAISE = 50_000_000;
