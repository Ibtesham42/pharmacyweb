# PharmaCareers — Pharmacy Job Portal & Medical Content Platform

Mobile-first, SEO-first platform for **pharmacy & medical jobs**, **medical news/articles**, and (future) **courses & paid PDFs**. India-focused. Single admin publishes content via a Blogger/WordPress-style editor.

## Tech stack
Next.js 15 (App Router) · React 19 · TypeScript · TailwindCSS + shadcn/ui · Prisma + PostgreSQL (Neon) · Auth.js (NextAuth v5) · Cloudinary · Zod. Hosted on Vercel.

## Quick start
```bash
cp .env.example .env       # fill DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, CLOUDINARY_*
npm install
npm run db:migrate         # apply schema (needs a Postgres/Neon DB)
npm run db:seed            # create admin + categories + India locations
npm run dev                # http://localhost:3000  (admin at /admin)
```

## Scripts
`dev` · `build` · `start` · `typecheck` · `lint` · `format` · `db:migrate` · `db:seed` · `db:studio` · `test` · `test:e2e`

## Project layout
- `app/` — public site, admin, API route handlers, SEO/PWA routes
- `services/` — framework-free domain logic
- `lib/` — prisma, auth, cloudinary, seo, validation, utils
- `prisma/` — schema, migrations, seed
- `components/` — shadcn ui + feature components
- `docs/` — SRS, architecture, database, roadmap, progress, changelog
- `.claude/` — agent definitions + reusable skills

## Documentation
Start with [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs/). Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Schema: [`docs/DATABASE.md`](docs/DATABASE.md).

## Deployment
Vercel + Neon (set `DATABASE_URL` pooled, `DIRECT_URL` direct) + Cloudinary. CI runs lint/typecheck/test/build (`.github/workflows/ci.yml`). See `.claude/skills/deployment_skill`.
