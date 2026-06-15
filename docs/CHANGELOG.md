# Changelog

All notable changes to this project are documented here (format: [Keep a Changelog](https://keepachangelog.com/)).

## [Unreleased] — 2026-06-15 — UX & accessibility pass

### Added
- **Dark mode** with system-preference detection and a header toggle; no flash on load.
- **Reading time** estimate on article and news pages.
- **Back-to-top** button on all public pages.
- **Skeleton loading states** on list and detail routes; **error pages** with retry (route-level + global fallback).
- **Telegram** share option (alongside WhatsApp, copy link, and native share).
- **Desktop header**: inline search bar + Categories dropdown; categories also listed in the mobile menu.
- **`ads.txt`** route for Google AdSense (publisher id derived from `NEXT_PUBLIC_ADSENSE_CLIENT`).
- Site-wide AdSense loader script on all public pages (for Google site review/approval + Auto ads); per-unit components now render only the `<ins>` to avoid a duplicate loader.
- **AI assistant (Phase 2 foundation):** Groq-powered, streaming healthcare chat at `/ai` and a floating chat button on every public page — knowledge modes (general, pharmacy education, career, job search, drug info), suggested prompts, copy/regenerate/stop/clear, markdown answers, and a permanent medical-safety disclaimer with emergency handling.
- **Admin → AI Settings:** enable/disable AI, maintenance mode, model selection, rate/daily limits, per-mode toggles, plus usage stats (requests, active users, tokens, errors, avg response time) and conversation/error logs. `GROQ_API_KEY` is server-only.
- **AI multimodal (image + document understanding):** attach medicine/plant/device/prescription photos or lab reports (vision + OCR) and PDF/DOCX/TXT files to chat about them (summaries, Q&A, key points, MCQs, translation). New medicinal-plant, medical-device, and pharmacy-student modes; confidence indicators + "verify with experts" safety wording. Uploads are processed **ephemerally (not stored)**. Admin adds image/document toggles, a vision model, size limits, and a per-day upload cap.

- **Pharmacy Career Copilot** (`/copilot`): a unified AI dashboard — Chat, **Resume Analysis** (score, missing skills, improvements, ATS tips), **Job Match** (ranked live listings with match % and missing skills), **Interview Prep** (role-based questions + answer outlines), **Study** (chat over your notes), and **Personalized Learning Recommendations** (focus areas + real article links). Structured results with graceful text fallback; resume handled ephemerally (not stored). Admin toggle for career tools.

- **Donation & Support platform** (`/donate`): voluntary donations via **Razorpay** (auto-verified) and **UPI/QR** (manual, no gateway). Donor form (anonymous option), printable receipts with a Supporter badge, "Support Us" CTA in the footer + homepage, and an admin Donations dashboard (settings incl. UPI ID + QR upload, donor management with verify/CSV export, and analytics: total raised, donors, monthly, avg, conversion, by-source). Razorpay secrets stay server-side.

### Changed
- Content cards now always show a visual header (featured image, or a branded placeholder for jobs without one) plus a clickable "View details" action.

## [0.1.0] — 2026-06-14 — MVP code-complete

### Added
- **Scaffold & tooling:** Next.js 15 (App Router) + React 19 + TypeScript (strict), TailwindCSS 3, shadcn/ui, ESLint, Prettier, security headers, CI workflow.
- **Governance:** root + 4 sub `CLAUDE.md`, 8 agent definitions, 8 reusable skills; docs (SRS, Architecture, Database/ER, Roadmap, Progress, Changelog).
- **Database:** Prisma schema covering all entities (users, posts, jobs, categories, tags, media, SEO, ads, products, orders, payments, analytics, audit logs, settings, contact, subscribers); migrations + Postgres full-text search (pg_trgm + GIN); idempotent seed with India locations and sample content.
- **Auth & security:** Auth.js (NextAuth v5) credentials + JWT, middleware RBAC, Zod validation, rate limiting, signed Cloudinary uploads, audit logging.
- **Public site:** homepage, jobs (with state/city/type filters), articles, news, categories, full-text search, detail pages, legal pages, future store/courses placeholders; mobile-first, PWA, ad slots, first-party analytics.
- **Admin:** secure login, analytics dashboard, post editor (Markdown + live preview, drag-drop image upload, autosave, scheduling, per-post SEO), and managers for categories, tags, advertisements, media, messages, and site settings.
- **SEO & monetization:** dynamic sitemap/robots/manifest/RSS, per-page metadata, JSON-LD (JobPosting/Article/NewsArticle/Breadcrumb/Organization/WebSite), canonical URLs, breadcrumbs, dynamic OpenGraph image; Google AdSense + banner/HTML ad slots with impression/click tracking.
- **Testing:** Vitest unit tests (slug, formatting, validation).

### Notes
- Requires Neon Postgres + Cloudinary credentials to run/deploy (see README and `docs/ROADMAP.md`).
- Commerce (courses/PDF/payments) and AI modules are schema/architecture-ready but intentionally not built in the MVP.
