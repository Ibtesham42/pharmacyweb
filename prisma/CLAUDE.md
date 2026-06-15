# CLAUDE.md — `prisma/` (Database)

PostgreSQL (Neon) via Prisma 6. Maps to the spec's "database" guide. Schema design rationale in `docs/DATABASE.md`.

## Connection (Neon)

- `DATABASE_URL` — pooled (pgbouncer) connection used by the app at runtime.
- `DIRECT_URL` — direct connection used by `prisma migrate`. Configured in `datasource.directUrl`.

## Migration workflow

```bash
npm run db:migrate          # create + apply a dev migration (prompts for name)
npm run db:generate         # regenerate client after schema edits
npm run db:deploy           # apply pending migrations in CI/prod
npm run db:seed             # seed admin + categories + India locations
```

- **Never edit a migration that has already been applied/committed.** Create a new one.
- Name migrations descriptively (`add_job_detail`, `add_post_fts`).
- The full-text search column + GIN index + `pg_trgm` are added via a **raw SQL migration** (Prisma can't express generated tsvector columns). Keep that SQL idempotent.

## Conventions

- IDs: `cuid()`. Timestamps: `createdAt @default(now())`, `updatedAt @updatedAt`.
- **Soft delete**: `deletedAt DateTime?` on `Post`; all public reads filter `deletedAt: null` and `status: PUBLISHED`.
- Money: integer minor units (`priceCents`) + `currency` (default `"INR"`).
- Index foreign keys and common filter/sort columns (see schema `@@index`).
- Enums for closed sets (`PostType`, `JobType`, `PostStatus`, ...).

## Seeding

`prisma/seed.ts` is idempotent (upserts): creates the admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD`, pharmacy categories, and loads `data/india-states-cities.json`.

## Review checklist

- [ ] Migration is additive/safe; no edits to applied migrations.
- [ ] New tables/columns indexed appropriately.
- [ ] Client regenerated; `npm run typecheck` passes.
- [ ] Seed still runs idempotently.

---
_Last updated: 2026-06-15 — AI models via `add_ai_module`; `3_ai_multimodal_modes` adds `AiMode` values (PLANT_ID/MEDICAL_DEVICE/STUDENT); pgvector `AiEmbedding` deferred (see `docs/AI.md`)._
