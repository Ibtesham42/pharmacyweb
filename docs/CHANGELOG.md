# Changelog

All notable changes to this project are documented here (format: [Keep a Changelog](https://keepachangelog.com/)).

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
