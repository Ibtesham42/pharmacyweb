import { describe, it, expect } from "vitest";
import { postPath, formatSalary, jobLocation, sectionForType } from "@/lib/format";

describe("postPath", () => {
  it("routes by type", () => {
    expect(postPath("JOB", "x")).toBe("/jobs/x");
    expect(postPath("NEWS", "x")).toBe("/news/x");
    expect(postPath("ARTICLE", "x")).toBe("/articles/x");
  });
});

describe("sectionForType", () => {
  it("maps types to sections", () => {
    expect(sectionForType("JOB")).toBe("jobs");
    expect(sectionForType("NEWS")).toBe("news");
    expect(sectionForType("ARTICLE")).toBe("articles");
  });
});

describe("formatSalary", () => {
  it("prefers explicit text", () => {
    expect(formatSalary(1, 2, "Negotiable")).toBe("Negotiable");
  });
  it("formats a range in INR", () => {
    expect(formatSalary(300000, 450000)).toContain("₹");
    expect(formatSalary(300000, 450000)).toContain("/ year");
  });
  it("returns null when nothing provided", () => {
    expect(formatSalary(null, null, null)).toBeNull();
  });
});

describe("jobLocation", () => {
  it("joins city and state", () => {
    expect(jobLocation("Chennai", "Tamil Nadu")).toBe("Chennai, Tamil Nadu");
  });
  it("falls back to India", () => {
    expect(jobLocation(null, null)).toBe("India");
  });
});
