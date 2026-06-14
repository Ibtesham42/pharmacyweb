# Architecture — Pharmacy Job Portal

_Last updated: Phase 2._

## Overview
Unified Next.js 15 (App Router) full-stack app on Vercel. Server Components render content (SSR/ISR) for SEO; Route Handlers expose REST for client/admin actions; Server Actions handle admin mutations. Prisma → Neon Postgres. Media → Cloudinary (signed uploads).

## Layering (strict)
```
app/        UI + routes (RSC, client islands, Route Handlers, Server Actions)
  ↓ calls
services/   domain logic — NO framework imports (posts, jobs, search, media, ads, analytics, contact, auth)
  ↓ uses
lib/        prisma (singleton), auth, cloudinary, seo, validation (zod), ratelimit, utils
  ↓
Neon Postgres (Prisma)   |   Cloudinary (media CDN)
```
Rationale: keeping domain logic in `services/` lets future AI modules, a standalone API, or payment providers attach without rewrites.

## Request flows
- **Public read**: RSC page → `services/*` → Prisma → render (ISR cached, revalidated on publish).
- **Search**: form → `/search` (RSC) or `/api/search` → `services/search` (Postgres FTS + trigram) → results; logs `AnalyticsEvent(SEARCH)`.
- **Admin mutation**: admin form (client) → Server Action → Zod validate → `services/*` → Prisma → `AuditLog` → `revalidateTag/Path`.
- **Upload**: client → `/api/media/upload` → validate MIME/size → signed Cloudinary upload → `Media` row.

## Cross-cutting
- **Auth**: Auth.js (NextAuth v5) credentials + JWT session; `middleware.ts` gates `/admin/*`.
- **Authorization**: role check in actions/handlers; RBAC ready (`ADMIN`, `EDITOR`).
- **Validation**: Zod schemas in `lib/validation`, applied at every boundary.
- **Rate limiting**: `lib/ratelimit` (in-memory; Upstash in prod) on login/search/upload/contact.
- **SEO**: `lib/seo` helpers + `<JsonLd>`; `app/sitemap.ts`, `robots.ts`, `manifest.ts`, `feed.xml`.
- **Security headers/CSP**: `next.config.mjs` + middleware.
- **Analytics**: first-party `AnalyticsEvent`; dashboard aggregates.

## Decisions (ADR-style)
- **ADR-1 Unified Next.js over separate backend** — best SEO (colocated SSR/ISR), lowest cost/ops for single-admin content site. Domain isolated in `services/` to allow later extraction.
- **ADR-2 Single `Post` table + `JobDetail` 1:1** — shared tags/categories/SEO/search; job-specific fields isolated; avoids polymorphic sprawl.
- **ADR-3 Markdown content + sanitized render** — smaller bundle (Lighthouse), safer than raw HTML; admin editor offers markdown + preview.
- **ADR-4 Money as integer paise + currency** — avoids float errors; future payments-ready.
- **ADR-5 Cloudinary signed uploads** — offload media + auto-optimize; keeps app stateless.

## Future-proofing
`services/ai/` provider-agnostic interface (default to latest Claude models when built); `PaymentProvider` interface (Razorpay-first, Stripe pluggable); optional Redis cache + queue/worker for heavy/async work; Neon read replicas for scale.

## Diagram
See the system diagram in `pharmacy-job-portal-staged-starlight.md` (plan) and the ER diagram in `DATABASE.md`.
