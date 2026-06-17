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
  FeatureStatus,
  ResourceType,
  ResourceAccess,
  ResourceStatus,
  ReviewStatus,
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

// Admin AI resource-authoring tools (admin-gated — no public clientId).
export const resourceAiToolSchema = z.enum(["excerpt", "seo", "tags", "mcqs", "flashcards"]);
export const resourceAiSchema = z
  .object({
    tool: resourceAiToolSchema,
    title: z.string().min(3, "Add a title first").max(200),
    type: z.string().max(40).optional(),
    text: z.string().max(40_000).optional(),
    fileId: z.string().min(1).max(64).optional(),
    useFile: z.boolean().optional(),
    count: z.coerce.number().int().min(1).max(20).optional(),
  })
  .refine((d) => (d.useFile && d.fileId) || (d.text?.trim().length ?? 0) >= 20, {
    message: "Add a longer description, or attach a file and use it as the source.",
    path: ["text"],
  });
export type ResourceAiTool = z.infer<typeof resourceAiToolSchema>;
export type ResourceAiInput = z.infer<typeof resourceAiSchema>;

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

const badgeThresholdsSchema = z
  .object({
    bronze: z.coerce.number().int().min(100).max(1_000_000_000),
    silver: z.coerce.number().int().min(100).max(1_000_000_000),
    gold: z.coerce.number().int().min(100).max(1_000_000_000),
    platinum: z.coerce.number().int().min(100).max(1_000_000_000),
  })
  .refine((t) => t.bronze <= t.silver && t.silver <= t.gold && t.gold <= t.platinum, {
    message: "Badge thresholds must increase: Bronze ≤ Silver ≤ Gold ≤ Platinum",
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
  featuredEnabled: z.boolean(),
  featuredMaxShow: z.coerce.number().int().min(1).max(60),
  featuredOnHomepage: z.boolean(),
  featuredOnDonatePage: z.boolean(),
  badgeThresholds: badgeThresholdsSchema,
});
export type DonationSettingsInput = z.infer<typeof donationSettingsSchema>;

// Admin updates to a single supporter's feature state / public message.
export const featureStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(FeatureStatus),
});

export const featuredMessageSchema = z.object({
  id: z.string().cuid(),
  message: z.string().max(280),
});

// ─────────────────────── Marketplace ───────────────────────
const optStr = (max: number) => z.string().max(max).optional().or(z.literal(""));

export const resourceCategorySchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  slug: z.string().max(80).regex(/^[a-z0-9-]*$/i).optional().or(z.literal("")),
  description: optStr(300),
  parentId: z.string().cuid().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const resourceSchema = z
  .object({
    title: z.string().min(3, "Title is too short").max(200),
    slug: z.string().max(200).regex(/^[a-z0-9-]*$/i).optional().or(z.literal("")),
    type: z.nativeEnum(ResourceType),
    categoryId: z.string().cuid().optional().or(z.literal("")),
    description: z.string().min(10, "Add a description").max(20_000),
    excerpt: optStr(300),
    author: optStr(120),
    access: z.nativeEnum(ResourceAccess).default(ResourceAccess.FREE),
    pricePaise: z.coerce.number().int().min(0).max(5_000_000).default(0),
    status: z.nativeEnum(ResourceStatus).default(ResourceStatus.DRAFT),
    fileId: z.string().cuid().optional().or(z.literal("")),
    fileType: optStr(20),
    fileSizeBytes: z.coerce.number().int().min(0).optional(),
    pageCount: z.coerce.number().int().min(0).max(100_000).optional(),
    previewImages: z.array(z.string().url()).max(8).default([]),
    tags: z.array(z.string().min(1).max(40)).max(20).default([]),
    metaTitle: optStr(120),
    metaDescription: optStr(300),
    ogImageUrl: z.string().url().optional().or(z.literal("")),
    abstract: optStr(5000),
    citation: optStr(1000),
    doi: optStr(120),
    publishedYear: z.coerce.number().int().min(1900).max(2100).optional(),
    featured: z.boolean().default(false),
  })
  .refine((d) => d.access !== ResourceAccess.PAID || d.pricePaise >= 100, {
    message: "Paid resources need a price of at least ₹1",
    path: ["pricePaise"],
  });
export type ResourceInput = z.infer<typeof resourceSchema>;

export const purchaseCreateSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(120),
  email: z.string().email("Enter a valid email"),
  method: z.nativeEnum(DonationMethod),
  website: z.string().max(0).optional(), // honeypot
});

export const purchaseVerifySchema = z.object({
  purchaseId: z.string().cuid(),
  razorpayPaymentId: z.string().min(4).max(120),
  razorpaySignature: z.string().min(8).max(256),
});

export const purchaseManualSchema = z.object({
  purchaseId: z.string().cuid(),
  transactionRef: z.string().min(4, "Enter the UPI reference / UTR").max(60),
});

// ─────────────────────────── Exam-prep bundles ───────────────────────────
export const bundleSchema = z.object({
  title: z.string().min(3, "Title is too short").max(200),
  slug: z.string().max(200).regex(/^[a-z0-9-]*$/i).optional().or(z.literal("")),
  description: z.string().min(10, "Add a description").max(20_000),
  excerpt: optStr(300),
  examType: optStr(40),
  pricePaise: z.coerce.number().int().min(100, "Set a price of at least ₹1").max(5_000_000),
  status: z.nativeEnum(ResourceStatus).default(ResourceStatus.DRAFT),
  coverImage: z.string().url().optional().or(z.literal("")),
  previewImages: z.array(z.string().url()).max(8).default([]),
  resourceIds: z.array(z.string().cuid()).min(1, "Add at least one resource").max(100),
  metaTitle: optStr(120),
  metaDescription: optStr(300),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().default(false),
});
export type BundleInput = z.infer<typeof bundleSchema>;

export const reviewSchema = z.object({
  resourceId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: optStr(120),
  body: optStr(2000),
});

export const reviewModerateSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(ReviewStatus),
});

export const buyerRequestLinkSchema = z.object({
  email: z.string().email("Enter a valid email"),
  name: optStr(120),
  next: optStr(300),
  website: z.string().max(0).optional(), // honeypot
});

export const buyerVerifySchema = z.object({
  token: z.string().min(10).max(200).optional(),
  email: z.string().email().optional(),
  code: z.string().min(4).max(8).optional(),
});

export const marketplaceSettingsSchema = z.object({
  enabled: z.boolean(),
  currency: z.string().min(3).max(3).default("INR"),
  upiId: optStr(120),
  qrImageUrl: z.string().url().optional().or(z.literal("")),
  featuredCount: z.coerce.number().int().min(1).max(60),
  reviewsRequireModeration: z.boolean(),
  upiFallbackEnabled: z.boolean(),
  premiumComingSoon: z.boolean(),
  freeRequiresAccount: z.boolean(),
});
export type MarketplaceSettingsInput = z.infer<typeof marketplaceSettingsSchema>;

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
