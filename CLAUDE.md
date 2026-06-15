# CLAUDE.md — Pharmacy Job Portal & Medical Content Platform (Root)

> Read this first. This is the source of truth for how we work in this repo.
> Sub-guides: [`app/CLAUDE.md`](app/CLAUDE.md) · [`services/CLAUDE.md`](services/CLAUDE.md) · [`prisma/CLAUDE.md`](prisma/CLAUDE.md) · [`docs/CLAUDE.md`](docs/CLAUDE.md)

## What this is

A mobile-first, SEO-first platform for **pharmacy & medical jobs + medical news/articles**, with a future store for courses and paid PDFs. Single admin publishes all content. India-focused (INR, Indian states/cities, govt + private pharma).

Full plan: see `docs/SRS.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/ROADMAP.md`, `docs/AI.md`.

## Tech stack (locked)

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| Styling | TailwindCSS 3 + shadcn/ui (Radix) |
| Data | Prisma 6 + PostgreSQL (Neon) |
| Auth | Auth.js (NextAuth v5) credentials + JWT sessions |
| Media | Cloudinary (signed uploads) |
| Validation | Zod (at every boundary) |
| Hosting | Vercel (+ Neon + Cloudinary) |

## Architecture rule (important)

`app/` (routes/UI) → `services/` (domain logic, **no framework imports**) → `lib/` (prisma, auth, cloudinary, seo, validation, utils).
Keep domain logic in `services/` so future AI modules, a standalone API, or payment providers can be added without rewrites.

## Commands

```bash
npm run dev          # local dev server
npm run build        # prisma generate + next build
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed admin + categories + India locations
npm run db:studio    # Prisma Studio
npm run test         # unit/integration (vitest)
npm run test:e2e     # Playwright
```

## Conventions

- **TypeScript strict**; no `any` without justification. Validate external input with Zod.
- **Server Components by default**; add `"use client"` only when needed (interactivity).
- **Mutations** via Server Actions or Route Handlers in `app/api/*`; never trust client input.
- **Money** stored as integer minor units (paise) + currency code.
- **Slugs** are unique, lowercase, generated via `slugify`.
- **Soft delete** posts via `deletedAt`; never hard-delete content.
- **SEO is mandatory** on every public page (metadata + JSON-LD + canonical). See `app/CLAUDE.md`.
- **Sanitize** all rendered user/admin content (markdown → sanitized HTML) to prevent XSS.
- File naming: `kebab-case` files, `PascalCase` components, `camelCase` functions.
- Commit style: `type(scope): summary` (e.g. `feat(jobs): add expiry filter`).

## Env

Copy `.env.example` → `.env`. Never commit secrets. Required: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `CLOUDINARY_*`. See `.env.example` for the full list.

## Update-after-every-phase checklist (do not skip)

1. Update the relevant `CLAUDE.md` (root + affected sub-guide).
2. Update `docs/ARCHITECTURE.md` if structure/flow changed.
3. Update `docs/ROADMAP.md` task statuses.
4. Append to `docs/PROGRESS.md` (what was done, decisions, follow-ups).
5. Append to `docs/CHANGELOG.md` (user-facing changes).
6. Run `npm run typecheck && npm run lint && npm run build` before declaring a phase done.

---
_Last updated: 2026-06-15 — AI module (Phase 2): Groq chat + **multimodal image/document understanding** + Admin AI Settings (see `docs/AI.md`), on top of the UX pass and Phase 11 MVP. Commerce deferred._
