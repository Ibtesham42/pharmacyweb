import { describe, it, expect } from "vitest";
import { toSlug, uniqueSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(toSlug("Hospital Pharmacist — Apollo")).toBe("hospital-pharmacist-apollo");
  });
  it("strips special characters and expands &", () => {
    expect(toSlug("B.Pharm & D.Pharm Jobs!")).toBe("bpharm-and-dpharm-jobs");
  });
});

describe("uniqueSlug", () => {
  it("returns the base when unused", async () => {
    const slug = await uniqueSlug("GPAT 2026", async () => false);
    expect(slug).toBe("gpat-2026");
  });
  it("appends a counter on collision", async () => {
    const taken = new Set(["gpat-2026", "gpat-2026-2"]);
    const slug = await uniqueSlug("GPAT 2026", async (s) => taken.has(s));
    expect(slug).toBe("gpat-2026-3");
  });
});
