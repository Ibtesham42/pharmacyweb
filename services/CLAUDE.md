# CLAUDE.md — `services/` (Domain / Backend Logic)

Framework-agnostic domain logic. Maps to the spec's "backend" guide. This is where business rules live so they can be reused by Route Handlers, Server Actions, future jobs/workers, AI modules, or a standalone API.

## Rules

- **No Next.js / React imports here.** Pure TS + Prisma + Zod only. (Importing `next/cache` for revalidation is the one allowed exception, kept in route/action callers — prefer returning data and revalidating in the caller.)
- Each domain has a file/folder: `posts`, `jobs`, `search`, `media`, `ads`, `analytics`, `contact`, `auth`, `ai`.
- `ai/` holds the AI domain (`settings`, `chat`, `usage`, `conversations`). Groq provider + prompts/safety live in `lib/ai/*`; the `GROQ_API_KEY` is server-only. See `docs/AI.md`.
- Functions take **validated** inputs (Zod schemas live in `lib/validation`). Validate at the edge (route/action), pass typed data in.
- Throw typed domain errors; let callers map to HTTP/UI responses.
- All DB access goes through `lib/prisma` (singleton). Never instantiate `PrismaClient` here.
- Enforce authorization in the caller (middleware/action); services assume the caller checked permissions, but never expose admin-only operations on public paths.
- Record an `AuditLog` entry for admin create/update/delete/publish actions.

## Adding a new content type

1. Add/extend Prisma models (`prisma/CLAUDE.md`).
2. Add Zod schema in `lib/validation`.
3. Add service functions (`list`, `getBySlug`, `create`, `update`, `softDelete`).
4. Expose via Server Action (admin) and/or Route Handler (public read).
5. Add public pages + SEO (`app/CLAUDE.md`).

## Review checklist

- [ ] No framework imports.
- [ ] Inputs typed/validated; outputs typed.
- [ ] Uses `lib/prisma` singleton.
- [ ] Admin mutations write an `AuditLog`.
- [ ] Soft-delete respected in reads (`deletedAt: null`).

---
_Last updated: 2026-06-17 — `services/ai` (chat, career, **resource-tools**, etc.) + `services/donations` (donations, settings, stats, CSV) + `services/{resources,resource-purchases,resource-reviews,resource-bookmarks,resource-categories,marketplace-settings,buyers}`; see `docs/AI.md`, `docs/DONATIONS.md`, `docs/MARKETPLACE.md`._
