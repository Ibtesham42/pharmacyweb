---
name: database_migration_skill
description: Safe Prisma migration workflow — plan, migrate, verify, roll back. Use for any schema change.
---

# Database Migration Skill

## When to use
Any change to `prisma/schema.prisma` or the database structure.

## Steps
1. Plan the change; prefer additive/backward-compatible edits. Note any backfill.
2. Edit `schema.prisma`; add indexes for new query paths; enums for closed sets.
3. `npm run db:migrate` (descriptive name). For FTS/raw SQL, write an idempotent raw migration.
4. `npm run db:generate`; run `npm run typecheck`.
5. Verify locally (Prisma Studio / queries); update `prisma/seed.ts` if needed.
6. Update `docs/DATABASE.md` (ER + notes). Apply in prod via `npm run db:deploy`.

## Checklist
- [ ] No edits to already-applied migrations.
- [ ] Indexes added; soft-delete respected.
- [ ] Seed still idempotent; typecheck passes.
- [ ] DATABASE.md updated.
