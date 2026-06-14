# Roadmap — Pharmacy Job Portal

_Last updated: Phase 11 (MVP code-complete)._ Status: ☐ todo · ◐ in progress · ☑ done

## MVP milestone

| Phase | Deliverable | Status |
|---|---|---|
| 1 Planning | SRS, architecture, DB design, plan (approved). | ☑ |
| 2 Architecture | Scaffold (Next.js+TS+Tailwind+shadcn), configs, CLAUDE.md ×5, 8 agents, 8 skills, docs, CI. | ☑ |
| 3 Database | Prisma schema (all entities), migrations (0_init, 1_fts), FTS SQL, seeds (admin, categories, India locations, samples). | ☑ |
| 4 Backend | Auth (Auth.js + JWT + RBAC middleware), services, Route Handlers/Server Actions, Zod validation, rate limiting, media upload (signed Cloudinary). | ☑ |
| 5 Frontend | Public pages (home, jobs+filters, articles, news, categories, search, legal, store/courses), mobile-first, PWA, ad slots. | ☑ |
| 6 Admin | Login, dashboard analytics, post editor (markdown+preview, drag-drop upload, autosave, schedule, SEO panel), managers (categories/tags/ads/media/messages/settings). | ☑ |
| 7 SEO | sitemap/robots/manifest/feed, generateMetadata, JSON-LD (JobPosting/Article/NewsArticle/Breadcrumb/Org/WebSite), canonical, breadcrumbs, dynamic OG image. | ☑ |
| 8 Ads | AdSense slots wired to config + impression/click tracking + banner/HTML ad types. | ☑ |
| 9 Testing | Unit tests (Vitest, 17 passing); build/typecheck/lint green. E2E (Playwright) scaffolded for later. | ☑ |
| 10 Deployment | `vercel-build` runs migrations; CI workflow; README + deployment_skill runbook. Needs Neon+Cloudinary provisioning to go live. | ◐ |
| 11 Documentation | CLAUDE.md ×5, SRS/ARCHITECTURE/DATABASE/ROADMAP/PROGRESS/CHANGELOG. | ☑ |

### Remaining to go live (requires accounts/secrets)
1. Provision Neon Postgres; set `DATABASE_URL` + `DIRECT_URL`.
2. Create Cloudinary account; set `CLOUDINARY_*` + `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. Set `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, admin seed vars.
4. `npm run db:deploy && npm run db:seed`, then deploy to Vercel.
5. (Optional) Add AdSense client id + `NEXT_PUBLIC_ADSENSE_ENABLED=true` and activate ad slots in admin.

## Future milestones (post-MVP, separate approvals)
- Commerce: courses marketplace, paid-PDF store, checkout (Razorpay), orders/payments UI.
- Newsletter + sponsorships; featured/sponsored job listings; affiliate.
- AI modules: article generation, SEO suggestions, job summaries, resume review, career guidance.
- Scaling: Redis cache, queue/worker, analytics rollups, read replicas.
