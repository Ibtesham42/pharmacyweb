import { z } from "zod";
import {
  PostType,
  PostStatus,
  JobType,
  MediaType,
  AdSlot,
  AdType,
  AiMode,
  DonationMethod,
} from "@prisma/client";

// ─────────────────────────── Auth ───────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, "Name is too short").max(120),
  email: z.string().email("Enter a valid email"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// ─────────────────────────── Shared ───────────────────────────
const referenceSchema = z.object({
  label: z.string().min(1).max(200),
  url: z.string().url(),
});

const seoSchema = z.object({
  metaTitle: z.string().max(70).optional().or(z.literal("")),
  metaDescription: z.string().max(180).optional().or(z.literal("")),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  ogTitle: z.string().max(120).optional().or(z.literal("")),
  ogDescription: z.string().max(200).optional().or(z.literal("")),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  keywords: z.array(z.string()).default([]),
  noindex: z.boolean().default(false),
});

const jobDetailSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  state: z.string().max(120).optional().or(z.literal("")),
  jobType: z.nativeEnum(JobType),
  salaryMin: z.coerce.number().int().nonnegative().optional(),
  salaryMax: z.coerce.number().int().nonnegative().optional(),
  salaryText: z.string().max(120).optional().or(z.literal("")),
  applyUrl: z.string().url("Application link must be a valid URL"),
  experienceLevel: z.string().max(120).optional().or(z.literal("")),
  qualifications: z.string().max(500).optional().or(z.literal("")),
  expiryDate: z.coerce.date().optional(),
});

// ─────────────────────────── Posts ───────────────────────────
export const postSchema = z
  .object({
    type: z.nativeEnum(PostType),
    title: z.string().min(3, "Title is too short").max(200),
    slug: z
      .string()
      .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers and hyphens")
      .optional()
      .or(z.literal("")),
    excerpt: z.string().max(300).optional().or(z.literal("")),
    content: z.string().min(1, "Content is required"),
    status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
    isFeatured: z.boolean().default(false),
    categoryId: z.string().cuid().optional().or(z.literal("")),
    featuredImageId: z.string().cuid().optional().or(z.literal("")),
    scheduledAt: z.coerce.date().optional(),
    tags: z.array(z.string().min(1).max(50)).max(20).default([]),
    references: z.array(referenceSchema).max(30).default([]),
    seo: seoSchema.optional(),
    jobDetail: jobDetailSchema.optional(),
  })
  .refine((d) => d.type !== PostType.JOB || !!d.jobDetail, {
    message: "Job posts require job details",
    path: ["jobDetail"],
  })
  .refine(
    (d) =>
      !d.jobDetail ||
      d.jobDetail.salaryMin == null ||
      d.jobDetail.salaryMax == null ||
      d.jobDetail.salaryMax >= d.jobDetail.salaryMin,
    { message: "Maximum salary must be greater than minimum", path: ["jobDetail", "salaryMax"] },
  );
export type PostInput = z.infer<typeof postSchema>;

// ─────────────────────────── Taxonomy ───────────────────────────
export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]*$/).optional().or(z.literal("")),
  description: z.string().max(300).optional().or(z.literal("")),
  parentId: z.string().cuid().optional().or(z.literal("")),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
});
export type TagInput = z.infer<typeof tagSchema>;

// ─────────────────────────── Ads ───────────────────────────
export const adSchema = z.object({
  name: z.string().min(2).max(120),
  slot: z.nativeEnum(AdSlot),
  type: z.nativeEnum(AdType),
  adsenseSlotId: z.string().max(50).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  targetUrl: z.string().url().optional().or(z.literal("")),
  htmlSnippet: z.string().max(5000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
export type AdInput = z.infer<typeof adSchema>;

// ─────────────────────────── Media ───────────────────────────
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const ALLOWED_DOC_TYPES = ["application/pdf"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB

export const mediaTypeFor = (mime: string): MediaType => {
  if (ALLOWED_IMAGE_TYPES.includes(mime)) return MediaType.IMAGE;
  if (mime === "application/pdf") return MediaType.PDF;
  if (mime.startsWith("video/")) return MediaType.VIDEO;
  return MediaType.DOC;
};

// ─────────────────────────── Public forms ───────────────────────────
export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(120),
  email: z.string().email("Enter a valid email"),
  subject: z.string().max(160).optional().or(z.literal("")),
  message: z.string().min(10, "Message is too short").max(4000),
  // Honeypot — must be empty (bots fill it).
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

// ─────────────────────────── AI ───────────────────────────
export const aiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message is empty").max(8000, "Message is too long"),
});

export const aiAttachmentImageSchema = z.object({
  dataUrl: z.string().startsWith("data:image/").max(15_000_000), // ~11MB base64
  mediaType: z.string().max(100),
});

export const aiChatSchema = z.object({
  clientId: z.string().min(8).max(64),
  mode: z.nativeEnum(AiMode).default(AiMode.GENERAL),
  conversationId: z.string().cuid().optional(),
  language: z.enum(["en", "hi", "hinglish"]).optional(),
  messages: z.array(aiChatMessageSchema).min(1, "No messages").max(40),
  attachments: z
    .object({
      images: z.array(aiAttachmentImageSchema).max(3).optional(),
      docName: z.string().max(300).optional(),
      docText: z.string().max(200_000).optional(),
    })
    .optional(),
});
export type AiChatInput = z.infer<typeof aiChatSchema>;

const aiModesSchema = z.object({
  GENERAL: z.boolean(),
  PHARMACY_EDU: z.boolean(),
  CAREER: z.boolean(),
  JOB_SEARCH: z.boolean(),
  DRUG_INFO: z.boolean(),
  PLANT_ID: z.boolean(),
  MEDICAL_DEVICE: z.boolean(),
  STUDENT: z.boolean(),
});

export const aiSettingsSchema = z.object({
  enabled: z.boolean(),
  maintenanceMode: z.boolean(),
  model: z.string().min(1).max(80),
  fastModel: z.string().min(1).max(80),
  visionModel: z.string().min(1).max(80),
  imageAnalysisEnabled: z.boolean(),
  documentAnalysisEnabled: z.boolean(),
  careerToolsEnabled: z.boolean(),
  temperature: z.coerce.number().min(0).max(2),
  maxOutputTokens: z.coerce.number().int().min(128).max(8192),
  perMinuteLimit: z.coerce.number().int().min(1).max(120),
  dailyLimit: z.coerce.number().int().min(1).max(100_000),
  perUserDailyLimit: z.coerce.number().int().min(1).max(10_000),
  maxUploadsPerDay: z.coerce.number().int().min(1).max(1_000),
  maxImageMB: z.coerce.number().int().min(1).max(25),
  maxDocMB: z.coerce.number().int().min(1).max(50),
  modes: aiModesSchema,
});
export type AiSettingsInput = z.infer<typeof aiSettingsSchema>;

// Career Copilot tool inputs
export const aiResumeSchema = z.object({
  clientId: z.string().min(8).max(64),
  resumeText: z.string().min(50, "Please provide more resume text").max(200_000),
});

export const aiInterviewSchema = z.object({
  clientId: z.string().min(8).max(64),
  role: z.string().min(2).max(120),
  jobContext: z.string().max(4000).optional(),
});

export const aiRecommendSchema = z.object({
  clientId: z.string().min(8).max(64),
  goal: z.string().min(2, "Tell us your goal").max(500),
  resumeText: z.string().max(200_000).optional(),
});

// ─────────────────────────── Donations ───────────────────────────
export const donationCreateSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(120),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(20).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  state: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  amountPaise: z.coerce.number().int().min(100, "Amount is too small").max(50_000_000, "Amount is too large"),
  method: z.nativeEnum(DonationMethod),
  source: z.string().max(40).optional().or(z.literal("")),
  anonymous: z.boolean().default(false),
  supporterConsent: z.boolean().default(false),
  reason: z.string().max(300).optional().or(z.literal("")),
  feedback: z.string().max(2000).optional().or(z.literal("")),
  // Honeypot — must be empty (bots fill it).
  website: z.string().max(0).optional(),
});
export type DonationCreateInput = z.infer<typeof donationCreateSchema>;

export const donationManualSchema = z.object({
  donationId: z.string().cuid(),
  transactionRef: z.string().min(4, "Enter the UPI reference / UTR").max(60),
});

export const donationVerifySchema = z.object({
  donationId: z.string().cuid(),
  razorpayPaymentId: z.string().min(4).max(120),
  razorpaySignature: z.string().min(8).max(256),
});

export const donationSettingsSchema = z.object({
  enabled: z.boolean(),
  title: z.string().min(2).max(120),
  message: z.string().max(500),
  pageContent: z.string().max(5000),
  thankYouMessage: z.string().max(500),
  upiId: z.string().max(120).optional().or(z.literal("")),
  qrImageUrl: z.string().url().optional().or(z.literal("")),
  minAmountPaise: z.coerce.number().int().min(100).max(10_000_000),
  suggestedAmounts: z.array(z.coerce.number().int().min(100).max(10_000_000)).max(12),
  goalPaise: z.coerce.number().int().min(0).max(1_000_000_000),
  monthlyGoalPaise: z.coerce.number().int().min(0).max(1_000_000_000),
});
export type DonationSettingsInput = z.infer<typeof donationSettingsSchema>;

// ─────────────────────────── Search ───────────────────────────
export const searchSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  type: z.nativeEnum(PostType).optional(),
  state: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  category: z.string().max(120).optional(),
  jobType: z.nativeEnum(JobType).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type SearchInput = z.infer<typeof searchSchema>;
