import { PrismaClient, PostType, PostStatus, JobType, AdSlot, AdType } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const slug = (s: string) => slugify(s, { lower: true, strict: true });

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@pharmacyportal.in";
  const password = process.env.ADMIN_PASSWORD || "ChangeThisStrongPassword123!";
  const name = process.env.ADMIN_NAME || "Site Admin";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name, passwordHash, role: "ADMIN" },
  });
  console.log(`✓ Admin: ${admin.email}`);
  return admin;
}

const CATEGORIES = [
  { name: "Pharmacy Jobs", description: "Pharmacist openings across India." },
  { name: "Medical Jobs", description: "Doctor, nurse and allied healthcare roles." },
  { name: "Government Jobs", description: "Government healthcare & pharmacy vacancies." },
  { name: "Pharma Company Jobs", description: "Openings at pharmaceutical companies." },
  { name: "Hospital Jobs", description: "Roles in hospitals and clinics." },
  { name: "Medical Representative", description: "MR and pharma sales roles." },
  { name: "Medical News", description: "Latest healthcare and pharma industry news." },
  { name: "Study Material", description: "Notes, guides and exam preparation." },
  { name: "Career Guidance", description: "Tips for pharmacy and medical careers." },
];

async function seedCategories() {
  const map = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: slug(c.name) },
      update: { name: c.name, description: c.description },
      create: { name: c.name, slug: slug(c.name), description: c.description },
    });
    map.set(c.name, cat.id);
  }
  console.log(`✓ Categories: ${map.size}`);
  return map;
}

async function seedSettings() {
  const locations = JSON.parse(
    readFileSync(join(process.cwd(), "data", "india-states-cities.json"), "utf-8"),
  );
  const settings: { key: string; value: unknown }[] = [
    { key: "locations", value: locations },
    {
      key: "homepage",
      value: {
        heroTitle: "Find Your Next Pharmacy & Medical Career",
        heroSubtitle:
          "Government and private pharmacist, medical representative, and healthcare jobs across India — plus news, articles and study material.",
        featuredCount: 6,
      },
    },
    {
      key: "contact",
      value: { email: "contact@pharmacyportal.in", phone: "", address: "India" },
    },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value as object },
      create: { key: s.key, value: s.value as object },
    });
  }

  // AI settings — create-only so re-seeding never clobbers admin-configured values.
  await prisma.siteSetting.upsert({
    where: { key: "ai" },
    update: {},
    create: {
      key: "ai",
      value: {
        enabled: false,
        maintenanceMode: false,
        model: "llama-3.3-70b-versatile",
        fastModel: "llama-3.1-8b-instant",
        temperature: 0.4,
        maxOutputTokens: 1024,
        perMinuteLimit: 8,
        dailyLimit: 2000,
        perUserDailyLimit: 50,
        modes: {
          GENERAL: true,
          PHARMACY_EDU: true,
          CAREER: true,
          JOB_SEARCH: true,
          DRUG_INFO: true,
        },
      },
    },
  });
  console.log(`✓ Site settings: ${settings.length + 1}`);
}

async function seedAds() {
  const ads = [
    { name: "Homepage Top (AdSense)", slot: "HOMEPAGE_TOP" as AdSlot },
    { name: "Sidebar (AdSense)", slot: "SIDEBAR" as AdSlot },
    { name: "In Content (AdSense)", slot: "IN_CONTENT" as AdSlot },
    { name: "Footer (AdSense)", slot: "FOOTER" as AdSlot },
    { name: "Job Page (AdSense)", slot: "JOB_PAGE" as AdSlot },
  ];
  for (const a of ads) {
    const exists = await prisma.advertisement.findFirst({ where: { name: a.name } });
    if (!exists) {
      await prisma.advertisement.create({
        data: { name: a.name, slot: a.slot, type: "ADSENSE" as AdType, isActive: false },
      });
    }
  }
  console.log(`✓ Ad slots seeded`);
}

async function seedSamplePosts(authorId: string, cats: Map<string, string>) {
  // Sample Job
  const jobTitle = "Hospital Pharmacist — Apollo Hospitals";
  await prisma.post.upsert({
    where: { slug: slug(jobTitle) },
    update: {},
    create: {
      type: PostType.JOB,
      title: jobTitle,
      slug: slug(jobTitle),
      excerpt: "Full-time hospital pharmacist role in Chennai. B.Pharm/D.Pharm with valid registration.",
      content:
        "## Role\nWe are hiring a **Hospital Pharmacist** to manage inpatient and outpatient pharmacy operations.\n\n## Requirements\n- B.Pharm or D.Pharm\n- Valid state pharmacy council registration\n- 1–3 years experience preferred\n\n## Responsibilities\n- Dispense medication accurately\n- Counsel patients\n- Maintain inventory and records",
      status: PostStatus.PUBLISHED,
      isFeatured: true,
      publishedAt: new Date(),
      authorId,
      categoryId: cats.get("Hospital Jobs"),
      jobDetail: {
        create: {
          companyName: "Apollo Hospitals",
          companyWebsite: "https://www.apollohospitals.com",
          city: "Chennai",
          state: "Tamil Nadu",
          jobType: JobType.FULL_TIME,
          salaryMin: 300000,
          salaryMax: 450000,
          salaryText: "₹3,00,000 – ₹4,50,000 / year",
          applyUrl: "https://www.apollohospitals.com/careers",
          experienceLevel: "1-3 years",
          qualifications: "B.Pharm / D.Pharm",
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      },
      seo: {
        create: {
          metaTitle: "Hospital Pharmacist Job at Apollo Hospitals, Chennai",
          metaDescription:
            "Apply for a full-time Hospital Pharmacist role at Apollo Hospitals, Chennai. B.Pharm/D.Pharm with valid registration.",
          keywords: ["hospital pharmacist", "pharmacy job chennai", "apollo hospitals job"],
        },
      },
    },
  });

  // Sample Article
  const artTitle = "How to Prepare for GPAT 2026: A Complete Guide";
  await prisma.post.upsert({
    where: { slug: slug(artTitle) },
    update: {},
    create: {
      type: PostType.ARTICLE,
      title: artTitle,
      slug: slug(artTitle),
      excerpt: "A step-by-step preparation strategy, syllabus breakdown and resources for GPAT 2026.",
      content:
        "## What is GPAT?\nThe Graduate Pharmacy Aptitude Test (GPAT) is a national entrance exam for M.Pharm admissions.\n\n## Study Plan\n1. Master Pharmaceutics, Pharmacology and Pharma Chemistry.\n2. Practice previous years' papers.\n3. Take regular mock tests.\n\n## Resources\n- Standard textbooks\n- Online mock series",
      status: PostStatus.PUBLISHED,
      isFeatured: true,
      publishedAt: new Date(),
      authorId,
      categoryId: cats.get("Study Material"),
      references: {
        create: [{ label: "Official GPAT portal", url: "https://nta.ac.in" }],
      },
      seo: {
        create: {
          metaTitle: "GPAT 2026 Preparation Guide — Syllabus, Strategy & Resources",
          metaDescription:
            "Complete GPAT 2026 preparation guide: syllabus breakdown, study plan and best resources for pharmacy aspirants.",
          keywords: ["gpat 2026", "gpat preparation", "pharmacy entrance exam"],
        },
      },
    },
  });

  // Sample News
  const newsTitle = "CDSCO Releases Updated Drug Approval Guidelines";
  await prisma.post.upsert({
    where: { slug: slug(newsTitle) },
    update: {},
    create: {
      type: PostType.NEWS,
      title: newsTitle,
      slug: slug(newsTitle),
      excerpt: "The Central Drugs Standard Control Organisation has issued revised guidelines for new drug approvals.",
      content:
        "The **CDSCO** has published updated guidelines aimed at streamlining the new drug approval process in India.\n\nKey changes include faster timelines for priority medicines and clearer documentation requirements.",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId,
      categoryId: cats.get("Medical News"),
      references: {
        create: [{ label: "CDSCO official site", url: "https://cdsco.gov.in" }],
      },
      seo: {
        create: {
          metaTitle: "CDSCO Updates Drug Approval Guidelines (2026)",
          metaDescription:
            "CDSCO releases revised new drug approval guidelines with faster timelines for priority medicines.",
          keywords: ["cdsco", "drug approval", "pharma news india"],
        },
      },
    },
  });

  console.log(`✓ Sample posts seeded (job, article, news)`);
}

async function applyFullTextSearch() {
  const sqlPath = join(process.cwd(), "prisma", "sql", "fts.sql");
  const sql = readFileSync(sqlPath, "utf-8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log(`✓ Full-text search indexes applied (${statements.length} statements)`);
}

async function main() {
  console.log("Seeding database…");
  const admin = await seedAdmin();
  const cats = await seedCategories();
  await seedSettings();
  await seedAds();
  await seedSamplePosts(admin.id, cats);
  await applyFullTextSearch();
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
