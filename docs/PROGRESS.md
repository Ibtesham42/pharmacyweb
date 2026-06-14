# Progress Log — Pharmacy Job Portal

## 2026-06-14 — Phase 1: Planning
- Approved master plan (`pharmacy-job-portal-staged-starlight.md`).
- Locked decisions: unified Next.js full-stack; Vercel + Neon + Cloudinary; MVP-first; India-focused (INR, Razorpay-ready).

## 2026-06-14 — Phase 2: Architecture / Scaffold (in progress)
- Scaffolded Next.js 15 + React 19 + TypeScript (strict) manually (create-next-app rejected the capitalized dir name).
- Added Tailwind 3 + shadcn design tokens (healthcare teal), PostCSS, ESLint, Prettier.
- Installed deps: Prisma 6, next-auth v5 (beta), bcryptjs, zod, cloudinary, react-markdown + remark-gfm + rehype-sanitize, radix primitives, sonner, lucide, slugify, date-fns. (568 packages, no errors.)
- Created root + 4 sub `CLAUDE.md`, 8 agent definitions, 8 skills, docs (SRS, ARCHITECTURE, DATABASE, ROADMAP, PROGRESS, CHANGELOG), `.env.example`, base `app/layout.tsx` + temporary homepage + `lib/site.ts` + `lib/utils.ts`.
- Next: CI workflow + README, then verify build, then Phase 3 (Prisma schema/migrations/seed).

### Decisions / notes
- Editor approach: markdown-based admin editor + sanitized markdown rendering (smaller public bundle, XSS-safe) — see ADR-3.
- ESLint pinned to v8 for clean `eslint-config-next` + `.eslintrc.json` compatibility.

## 2026-06-14 — Phases 3–11: MVP code-complete
- **DB (3):** Full `prisma/schema.prisma` (17 models, all required entities). Migrations `0_init` + `1_fts` (pg_trgm + GIN expression index). `prisma/sql/fts.sql`, idempotent `seed.ts` (admin, 9 categories, 36 states/UTs, 3 sample posts, ad slots), `data/india-states-cities.json`. Prisma client generates; schema validates.
- **Backend (4):** Auth.js v5 credentials + JWT (split edge/node config), middleware RBAC on `/admin`, `lib/` (prisma, auth, cloudinary signed uploads, seo, zod validation, ratelimit, audit, session, format, slug), services (posts, search FTS, categories, tags, media, ads, analytics, contact, settings), API routes (search, analytics, contact, ads/track, newsletter, media sign/CRUD, revalidate, nextauth).
- **Public (5):** Home, jobs (+state/city/type filters), articles, news, categories, search, job/article/news details, legal pages, store/courses placeholders. shadcn UI, mobile-first, PWA manifest, ad slots, page-view + outbound-click tracking.
- **Admin (6):** Login, dashboard analytics, post editor (markdown+preview, drag-drop image upload, autosave to localStorage, schedule, SEO panel, references, tags), managers for categories/tags/ads/media/messages/settings; server actions with audit + revalidation.
- **SEO/Ads (7–8):** sitemap/robots/manifest/feed, per-page metadata, JSON-LD generators, canonical, breadcrumbs, dynamic OG image (next/og); AdSlot supporting AdSense/banner/HTML with tracking.
- **Testing (9):** Vitest (pinned v2 for Node 21) — 17 unit tests passing (slug, format, validation). `npm run build`, `typecheck`, `lint` all green (31 routes).
- **Deploy (10):** `vercel-build` runs `prisma migrate deploy`; CI workflow; resilient `safe()` wrapper so prerender survives DB outages.

### Notes / follow-ups
- No live DB/Cloudinary in this environment, so `migrate dev`/`seed`/runtime data paths are authored but not executed here — see ROADMAP "Remaining to go live".
- `prisma:error` logs during local build are expected (dummy DB) and are caught by `safe()`; production build with Neon will be clean.
- E2E (Playwright) left as a scaffold task; unit + build are the current CI gate.

## 2026-06-14 — Hardening + performance pass (post-deploy to GitHub)
- Pushed to GitHub (Ibtesham42/pharmacyweb); added CI status badge.
- Connected a live Neon DB, ran `migrate deploy` + `seed`; verified end-to-end locally.
- **Security audit (live):** admin routes 307→login; protected APIs 401; Zod validation 400s; SQL-injection probes safe (parameterized); rate limiting 30/min verified (30 ok / 10 → 429); added a **Content-Security-Policy** header (the one missing header). `npm audit`: 0 exploitable production-runtime vulns (3 moderate are Next's bundled build-time postcss; high/critical are dev-only vitest/esbuild).
- **Performance (#2 + #3):** detail pages (`/jobs|/articles|/news/[slug]`) made **SSG + ISR** via `generateStaticParams` + `revalidate=300`; moved view-counting off the render path to a client **ViewBeacon** → `/api/analytics` (POST_VIEW increments `viewCount`). Cached ad-slot lookups with `unstable_cache` (tag `ads`, invalidated by ad actions) and deduped post fetches with React `cache()`.
  - **Result (prod benchmark):** detail pages **2.9s → ~0.004s** (ISR cache hit); homepage ~3ms. List/search pages remain SSR (~1.1–1.9s) because they read `searchParams` — dominated by cross-region (Singapore) Neon latency; the deploy-side fix is co-locating the Vercel function region with the DB region.
