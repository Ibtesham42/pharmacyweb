import { describe, it, expect } from "vitest";
import { postSchema, contactSchema, searchSchema } from "@/lib/validation";

describe("postSchema", () => {
  const base = {
    type: "ARTICLE",
    title: "How to prepare for GPAT",
    content: "Some content",
  };

  it("accepts a valid article", () => {
    expect(postSchema.safeParse(base).success).toBe(true);
  });

  it("requires job details for JOB posts", () => {
    const res = postSchema.safeParse({ ...base, type: "JOB" });
    expect(res.success).toBe(false);
  });

  it("accepts a valid job", () => {
    const res = postSchema.safeParse({
      ...base,
      type: "JOB",
      jobDetail: { companyName: "Apollo", jobType: "FULL_TIME", applyUrl: "https://x.com" },
    });
    expect(res.success).toBe(true);
  });

  it("rejects salary max below min", () => {
    const res = postSchema.safeParse({
      ...base,
      type: "JOB",
      jobDetail: {
        companyName: "Apollo",
        jobType: "FULL_TIME",
        applyUrl: "https://x.com",
        salaryMin: 500000,
        salaryMax: 100000,
      },
    });
    expect(res.success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("requires a valid email and message length", () => {
    expect(contactSchema.safeParse({ name: "A B", email: "bad", message: "short" }).success).toBe(false);
    expect(
      contactSchema.safeParse({ name: "A B", email: "a@b.com", message: "A long enough message" }).success,
    ).toBe(true);
  });
});

describe("searchSchema", () => {
  it("defaults q to empty and page to 1", () => {
    const res = searchSchema.parse({});
    expect(res.q).toBe("");
    expect(res.page).toBe(1);
  });
});
