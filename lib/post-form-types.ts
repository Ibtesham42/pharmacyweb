import type { PostType, PostStatus } from "@prisma/client";

export interface RefItem {
  label: string;
  url: string;
}

export interface JobFields {
  companyName: string;
  companyWebsite: string;
  state: string;
  city: string;
  jobType: string;
  salaryMin: string;
  salaryMax: string;
  salaryText: string;
  applyUrl: string;
  experienceLevel: string;
  qualifications: string;
  expiryDate: string;
}

export interface PostFormInitial {
  type: PostType;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string[];
  featuredImage: { id?: string; url?: string };
  isFeatured: boolean;
  status: PostStatus;
  scheduledAt: string;
  references: RefItem[];
  seo: { metaTitle: string; metaDescription: string; ogImageUrl: string; keywords: string; noindex: boolean };
  job: JobFields;
}

export function emptyInitial(type: PostType): PostFormInitial {
  return {
    type,
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    categoryId: "",
    tags: [],
    featuredImage: {},
    isFeatured: false,
    status: "DRAFT",
    scheduledAt: "",
    references: [],
    seo: { metaTitle: "", metaDescription: "", ogImageUrl: "", keywords: "", noindex: false },
    job: {
      companyName: "",
      companyWebsite: "",
      state: "",
      city: "",
      jobType: "FULL_TIME",
      salaryMin: "",
      salaryMax: "",
      salaryText: "",
      applyUrl: "",
      experienceLevel: "",
      qualifications: "",
      expiryDate: "",
    },
  };
}
