---
name: deployment_skill
description: Pre-deploy checklist and Vercel/Neon/Cloudinary deployment with post-deploy verification. Use when shipping.
---

# Deployment Skill

## When to use
Deploying to Vercel (preview or production).

## Steps
1. Pre-flight: `npm run typecheck && npm run lint && npm run test && npm run build` all green.
2. Ensure env vars set in Vercel (DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, CLOUDINARY_*, ADSENSE).
3. Apply migrations: `npm run db:deploy` (uses DIRECT_URL). Seed admin if new DB.
4. Deploy (Vercel build runs `prisma generate && next build`).
5. Post-deploy smoke test: home, a job detail, search, admin login, an upload.
6. Submit/refresh sitemap in Search Console; validate structured data; check Core Web Vitals.

## Checklist
- [ ] CI/build green; env vars present.
- [ ] Migrations applied; admin seeded.
- [ ] Smoke test passes on mobile.
- [ ] Sitemap submitted; structured data valid.
