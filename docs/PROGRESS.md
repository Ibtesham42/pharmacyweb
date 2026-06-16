# Progress Log — Pharmacy Job Portal

## 2026-06-14 — Phase 1: Planning
- Approved master plan (`pharmacy-job-portal-staged-starlight.md`).
- Locked decisions: unified Next.js full-stack; Vercel + Neon + Cloudinary; MVP-first; India-focused (INR, Razorpay-ready).

## 2026-06-14 — Phase 2: Architecture / Scaffold (in progress)
- Scaffolded Next.js 15 + React 19 + TypeScript (strict) manually (create-next-app rejected the capitalized dir name).
- Added Tailwind 3 + shadcn design tokens (healthcare teal), PostCSS, ESLint, Prettier.
- Installed deps: Prisma 6, next-auth v5 (beta), bcryptjs, zod, cloudinary, react-markdown + remark-gfm + rehype-sanitize, radix primitives, sonner, lucide, slugify, date-fns. (568 packages, no errors.)
- Created root + 4 sub `CLAUDE.md`, 8 agent definitions, 8 skills, docs (SRS, ARCHITECTURE, DATABASE, ROADMAP, PROGRESS, CHANGELOG), `.env.example`, base `app/layout.tsx` + temporary homepage + `lib/site.ts` + `lib/utils.ts`.
- Next: CI workflow + README, then verify build, then Phase 3 (Prisma schema/migrations/seed).

### Decisions / notes
- Editor approach: markdown-based admin editor + sanitized markdown rendering (smaller public bundle, XSS-safe) — see ADR-3.
- ESLint pinned to v8 for clean `eslint-config-next` + `.eslintrc.json` compatibility.

## 2026-06-14 — Phases 3–11: MVP code-complete
- **DB (3):** Full `prisma/schema.prisma` (17 models, all required entities). Migrations `0_init` + `1_fts` (pg_trgm + GIN expression index). `prisma/sql/fts.sql`, idempotent `seed.ts` (admin, 9 categories, 36 states/UTs, 3 sample posts, ad slots), `data/india-states-cities.json`. Prisma client generates; schema validates.
- **Backend (4):** Auth.js v5 credentials + JWT (split edge/node config), middleware RBAC on `/admin`, `lib/` (prisma, auth, cloudinary signed uploads, seo, zod validation, ratelimit, audit, session, format, slug), services (posts, search FTS, categories, tags, media, ads, analytics, contact, settings), API routes (search, analytics, contact, ads/track, newsletter, media sign/CRUD, revalidate, nextauth).
- **Public (5):** Home, jobs (+state/city/type filters), articles, news, categories, search, job/article/news details, legal pages, store/courses placeholders. shadcn UI, mobile-first, PWA manifest, ad slots, page-view + outbound-click tracking.
- **Admin (6):** Login, dashboard analytics, post editor (markdown+preview, drag-drop image upload, autosave to localStorage, schedule, SEO panel, references, tags), managers for categories/tags/ads/media/messages/settings; server actions with audit + revalidation.
- **SEO/Ads (7–8):** sitemap/robots/manifest/feed, per-page metadata, JSON-LD generators, canonical, breadcrumbs, dynamic OG image (next/og); AdSlot supporting AdSense/banner/HTML with tracking.
- **Testing (9):** Vitest (pinned v2 for Node 21) — 17 unit tests passing (slug, format, validation). `npm run build`, `typecheck`, `lint` all green (31 routes).
- **Deploy (10):** `vercel-build` runs `prisma migrate deploy`; CI workflow; resilient `safe()` wrapper so prerender survives DB outages.

### Notes / follow-ups
- No live DB/Cloudinary in this environment, so `migrate dev`/`seed`/runtime data paths are authored but not executed here — see ROADMAP "Remaining to go live".
- `prisma:error` logs during local build are expected (dummy DB) and are caught by `safe()`; production build with Neon will be clean.
- E2E (Playwright) left as a scaffold task; unit + build are the current CI gate.

## 2026-06-14 — Hardening + performance pass (post-deploy to GitHub)
- Pushed to GitHub (Ibtesham42/pharmacyweb); added CI status badge.
- Connected a live Neon DB, ran `migrate deploy` + `seed`; verified end-to-end locally.
- **Security audit (live):** admin routes 307→login; protected APIs 401; Zod validation 400s; SQL-injection probes safe (parameterized); rate limiting 30/min verified (30 ok / 10 → 429); added a **Content-Security-Policy** header (the one missing header). `npm audit`: 0 exploitable production-runtime vulns (3 moderate are Next's bundled build-time postcss; high/critical are dev-only vitest/esbuild).
- **Performance (#2 + #3):** detail pages (`/jobs|/articles|/news/[slug]`) made **SSG + ISR** via `generateStaticParams` + `revalidate=300`; moved view-counting off the render path to a client **ViewBeacon** → `/api/analytics` (POST_VIEW increments `viewCount`). Cached ad-slot lookups with `unstable_cache` (tag `ads`, invalidated by ad actions) and deduped post fetches with React `cache()`.
  - **Result (prod benchmark):** detail pages **2.9s → ~0.004s** (ISR cache hit); homepage ~3ms. List/search pages remain SSR (~1.1–1.9s) because they read `searchParams` — dominated by cross-region (Singapore) Neon latency; the deploy-side fix is co-locating the Vercel function region with the DB region.

## 2026-06-15 — UX & content-display conformance pass (public site)
- Audited the public site against the UX/content-display requirements; most of the spec was already met by the MVP, so this pass closed the concrete remaining gaps.
- **Dark mode:** added `next-themes` + `components/theme-provider.tsx` (wraps root layout) + `components/public/theme-toggle.tsx` (mounted-guard placeholder, no hydration flash). `.dark` tokens and `darkMode:"class"` already existed.
- **Reading time:** `readingTime()` in `lib/format.ts`, shown in `components/public/article-detail.tsx`.
- **Back-to-top:** `components/public/back-to-top.tsx`, mounted once in `app/(public)/layout.tsx`.
- **Loading/error states:** `components/public/card-skeleton.tsx` + `loading.tsx` for list (jobs/articles/news/categories/search) and detail routes; `components/public/error-state.tsx` + `app/(public)/error.tsx` + `app/global-error.tsx`.
- **Share:** added Telegram to `components/public/share-buttons.tsx`.
- **Cards:** `components/public/post-card.tsx` — every card now has a visual header (branded placeholder for imageless jobs) and a clickable "View details" link.
- **Nav:** new `components/ui/dropdown-menu.tsx` (Radix); `app/(public)/layout.tsx` fetches categories via `safe(listPublicCategories())` and passes them to `site-header.tsx`, which adds a desktop Categories dropdown + compact inline `SearchBar` (new `compact` prop) + `ThemeToggle` (desktop & mobile) and lists categories in the mobile menu.
- Implemented via the **frontend-agent** under the **ui_design_skill**; `typecheck`, `lint`, `build` all green (31 routes; expected `prisma:error` logs are caught by `safe()`).

### Notes / follow-ups
- Deferred as future-ready (per scope decision): Recently Viewed, Trending/Popular, Bookmark/Save.
- `global-error.tsx` uses inline light-theme styles (it replaces the root layout, so it can't rely on Tailwind/theme).
- AdSense enabled (`NEXT_PUBLIC_ADSENSE_ENABLED=true`, `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-…`); added `app/ads.txt/route.ts`. Live ads still require the same `NEXT_PUBLIC_*` vars set in Vercel + redeploy (build-time inlined) and an active ADSENSE ad with a slot id in admin (`ad-slot.tsx` guards on all three).

## 2026-06-15 — AI module (Phase 2 foundation): Groq chat + Admin AI Settings
- **Decision:** Groq via the Vercel AI SDK (`ai` 6 + `@ai-sdk/groq`); server `streamText().toTextStreamResponse()`, custom client stream reader (no dependence on the v6 `useChat`/UIMessage surface). API verified against the installed `.d.ts` before coding. `GROQ_API_KEY` is env-only (server-side); AI config in `SiteSetting` key `"ai"`; chat is anonymous (per-browser `clientId`, no public auth).
- **DB:** added enums `AiMode/AiRole/AiRequestStatus` and models `AiConversation`, `AiMessage`, `AiRequestLog`, `AiKnowledgeFile` (RAG-ready). Seed creates default `"ai"` settings (create-only). Migration `add_ai_module` to be applied (`prisma migrate dev`); `prisma generate` updates the client.
- **lib/ai:** `config.ts` (settings type/defaults, model list, modes, suggested prompts, disclaimer), `safety.ts` (per-mode system prompts, `detectEmergency`, emergency notice), `groq.ts` (server-only provider). Zod `aiChatSchema`/`aiSettingsSchema` in `lib/validation.ts`.
- **services/ai:** `settings`, `chat` (limits via `lib/ratelimit` + daily DB counts, message persistence), `usage` (stats + logs), `conversations` (history/clear).
- **API:** `app/api/ai/chat/route.ts` (validate → gate enabled/maintenance/mode/key → limits → emergency short-circuit → stream → `onFinish` persist + `AiRequestLog`), `app/api/ai/conversations/route.ts`.
- **Admin:** `/admin/ai` (stats cards + Settings/Conversations/Errors tabs), `ai-settings-form.tsx`, `actions.ts` (requireAdmin + audit + revalidate); nav item added to `admin-shell.tsx`.
- **Public:** `/ai` page + `ai-chat.tsx` (streaming, typing, copy/regenerate/stop/clear, suggested prompts, mode select, localStorage history), `ai-chat-fab.tsx` (floating button, layout-gated by enabled), `ai-disclaimer.tsx`; nav "AI Assistant" added; `back-to-top` nudged to `bottom-24` to clear the FAB.
- **Deferred (designed in `docs/AI.md`):** RAG (pgvector `AiEmbedding`), Resume Analyzer, Interview Prep, Job Match, AI Article Assistant, AI semantic search, multilingual (param plumbed), voice/STT/TTS and other future modules.
- New deps: `ai`, `@ai-sdk/groq` (removed the unused `@ai-sdk/react`). New env: `GROQ_API_KEY` (set locally + in Vercel, then redeploy; enable in Admin → AI Settings).

### Follow-ups
- Apply the `add_ai_module` migration to Neon and set `GROQ_API_KEY`; then enable AI in admin to go live.
- In-memory per-minute limiter is per-instance; daily limits use DB counts. Add Upstash Redis for strict global burst limits if needed.

## 2026-06-15 — AI multimodal (image + document understanding)
- Extended the AI assistant additively (text chat unchanged) with **image** and **document** understanding.
- **Decisions:** uploads are **ephemeral/not stored** (images → base64 to a Groq vision model in-memory; docs → server text-extraction, text held client-side and re-sent on follow-ups). Documents via `unpdf` (PDF) + `mammoth` (DOCX) + TXT. Added 3 modes (`PLANT_ID`, `MEDICAL_DEVICE`, `STUDENT`).
- **DB:** migration `3_ai_multimodal_modes` adds the 3 `AiMode` enum values (additive). No new tables (uploads ephemeral); multimodal turns tagged via `AiRequestLog.feature` (`CHAT_IMAGE`/`CHAT_DOC`).
- **lib/ai:** `extract.ts` (unpdf/mammoth + Promise.withResolvers polyfill); `config.ts`/`safety.ts` extended (vision model, image/doc flags, limits, new modes, multimodal + confidence/safety guidance). Zod `aiChatSchema` gains `attachments`; `aiSettingsSchema` gains the new fields/modes.
- **API:** new `app/api/ai/extract` (doc → text, no storage); `app/api/ai/chat` extended (attachments, image vs vision-model selection, upload/day limit) with the text path unchanged.
- **UI:** `ai-chat.tsx` paperclip attach (images as data URLs; docs via extract), attachment chips + thumbnails, follow-up "chat with file"; admin `ai-settings-form` multimodal card; flags threaded through `/ai` page, public layout, and the FAB.
- Verified: `typecheck`, `lint`, `build` green (unpdf/mammoth bundle cleanly). New deps: `unpdf`, `mammoth`.

### Follow-ups
- Apply `3_ai_multimodal_modes` to Neon (additive enum values; also applied automatically by Vercel `vercel-build`).
- Verify a real image reaches the Groq Llama-4 vision model in a live smoke test once `GROQ_API_KEY` is active.

## 2026-06-15 — Pharmacy Career Copilot (unified career experience)
- New unified **`/copilot`** dashboard (tabs: Chat · Resume · Job Match · Interview · Study · Learn), reusing `AiChat` (Study = STUDENT mode + separate `storageNamespace`).
- **Structured tools** via AI SDK `generateObject` (typed Zod schemas in `lib/ai/career.ts`): resume score/strengths/missing/improvements/ATS; job match % vs **live** listings (`listPosts`); interview Q&A by role; learning recs from real articles/categories. Each has a `generateText` markdown fallback so it never hard-fails.
- `services/ai/career.ts` (`analyzeResume`/`matchJobs`/`interviewQuestions`/`recommendLearning`); routes `app/api/ai/career/{resume,job-match,interview,recommend}`; gated by `enabled` + `careerToolsEnabled` + key + `checkLimits`.
- **Ephemeral/private:** resume extracted via existing `/api/ai/extract`, held in the browser (sessionStorage), reused across tabs; never stored. Usage logged via `AiRequestLog.feature` (RESUME/JOB_MATCH/INTERVIEW/LEARN) — **no new DB tables/migration**.
- Admin `careerToolsEnabled` toggle; nav "Career Copilot" link; `AiChat` gained `defaultMode`/`storageNamespace` props (text chat otherwise unchanged).
- Verified: `typecheck`, `lint`, `build` green (`/copilot` + 4 career routes).

## 2026-06-16 — Donation & Support platform
- Added a complete donation system (additive; existing features unchanged). **Razorpay** (signature + webhook verified) **and** **UPI/QR manual** (admin UPI ID + uploaded QR; donor submits UTR; admin verifies). Razorpay via REST + Node `crypto` — **no new deps**; keys env-only.
- **DB:** `Donation` model + `DonationStatus`/`DonationMethod` enums (migration `4_add_donations`); settings in `SiteSetting` key `"donations"` (seeded create-only, disabled by default).
- **lib/services:** `lib/donations/config.ts`, `lib/razorpay.ts`, donation Zod schemas, `formatINR`; `services/donations.ts` (create/markPaid/manual/adminSetStatus/stats/CSV/settings).
- **API:** `app/api/donations/{create,verify,manual}` + `app/api/razorpay/webhook` (idempotent `markPaidByOrderId`). Rate-limit + honeypot + min/cap + gating.
- **Public:** `/donate` (amounts, methods, donor form, Razorpay Checkout / UPI+QR), `/donate/receipt/[id]` (printable, receipt-safe), `DonateCta` in footer + homepage (gated). Global `@media print` rule hides chrome.
- **Admin:** `/admin/donations` (Donors/Overview/Settings tabs), settings form with Cloudinary QR upload, donor table verify/reject, CSV export route; nav item added.
- Verified: `typecheck`, `lint`, `build` green (`/donate`, `/donate/receipt/[id]`, 4 donation routes, `/admin/donations`).

### Follow-ups
- Apply `4_add_donations` (auto via Vercel `vercel-build`); enable + configure in Admin → Donations.
- Razorpay: set keys + webhook secret in Vercel and register the webhook URL; UPI works without them.
- Future: recurring/memberships/crowdfunding (design in `docs/DONATIONS.md`); email receipts (add Resend).

## 2026-06-16 — Featured Supporters system
- Completed the supporters workflow behind the existing "You may feature me as a supporter" toggle (additive; donations/receipts unchanged).
- **Consent → moderation:** `createDonation` now sets `featureStatus = PENDING` on consent (`NONE` otherwise). A supporter is **public only when an admin approves it AND the donation is PAID** — consent alone never publishes.
- **DB:** migration `5_add_featured_supporters` adds enum `FeatureStatus` + `Donation.featureStatus/featuredMessage/featuredAt` + `@@index([featureStatus, featuredAt])`, and **backfills** existing `supporterConsent = true` rows to `PENDING`. Applied to Neon via `migrate deploy`; verified the one existing PAID opt-in landed in the queue (`featureStatus=PENDING`).
- **Config/validation:** `lib/donations/config.ts` gains featured settings (`featuredEnabled`, `featuredMaxShow`, `featuredOnHomepage`, `featuredOnDonatePage`, `badgeThresholds`), supporter levels/badges + `supporterLevelFor()`, and a privacy-safe `PublicSupporter` type. `donationSettingsSchema` extended (thresholds must increase); new `featureStatusSchema`/`featuredMessageSchema`.
- **services/donations:** `setFeatureStatus`, `setFeaturedMessage`, `listSupporters` (admin internal view), `getPublicFeaturedSupporters` (APPROVED+PAID → public shape; anonymous → "Anonymous Supporter"; never exposes email/phone/address/amount), `featuredAnalytics` (total, pending, by-month, most-active).
- **Admin:** new **Supporters** tab in `/admin/donations` (`supporters-table.tsx`) — Approve/Reject/Feature/Remove + editable public thank-you message + analytics; pending count badged on the tab. Settings form gains the Featured-Supporters card (toggles, max-to-show, badge thresholds). Actions `setFeatureStatusAction`/`setFeaturedMessageAction` (requireAdmin + audit + revalidate `/`, `/donate`).
- **Public:** `components/public/featured-supporters.tsx` rendered on the homepage and `/donate` (each gated by its placement switch + `featuredEnabled`); shows name/Anonymous, tiered badge, date, optional message only.
- Verified: `typecheck`, `lint`, `build` all green; migration applied + backfill confirmed by query.

### Follow-ups
- Enable in Admin → Donations → Settings (Featured Supporters), then approve supporters in the Supporters tab.
- Badge tiers derive from the per-donation amount; cumulative-tier / supporter profiles deferred.

## 2026-06-16 — Digital Resources Marketplace (Phase 1 MVP)
- Built a full marketplace for downloadable resources (free + paid) — additive; existing features unchanged. Plan: `docs/MARKETPLACE.md`. Decisions captured after a 3-agent architecture audit + user sign-off on 4 questions (phased MVP, magic-link buyer accounts, token+signed-URL delivery, Razorpay-instant + UPI fallback).
- **DB:** migration `6_add_marketplace` (additive) adds enums `ResourceType/ResourceAccess/ResourceStatus/ReviewStatus` and models `ResourceCategory`, `Resource`, `ResourceTag` (reuses `Tag`), `Buyer`, `BuyerAuthToken` (hash-only), `ResourcePurchase` (mirrors `Donation`), `ResourceReview`, `ResourceBookmark`, `ResourceDownload`. Seed adds 14 starter categories + create-only `marketplace` settings. **Migration written + client generated; apply to Neon is the one pending manual step (classifier blocks live-DB writes) — run `npm run db:deploy && npm run db:seed`.**
- **Reused (no new deps):** `lib/razorpay.ts` (purchases), Cloudinary (extended with `uploadProtected` + `signedDownloadUrl`), settings/slug/format/validation/ratelimit/audit, admin CRUD + public SEO patterns.
- **Buyer identity:** passwordless magic-link/OTP — `lib/mailer.ts` (Resend REST + dev console fallback), `lib/buyer-session.ts` (HMAC httpOnly cookie; admin auth/middleware untouched), `services/buyers.ts`, `app/api/buyers/*`, `/account/login` + `/account` dashboard.
- **Secure delivery:** paid files = Cloudinary authenticated assets; `app/api/resources/[slug]/download` verifies entitlement (session or `lib/download-token` HMAC) → 302 to a ~90s signed URL. Protected upload via `app/api/admin/resources/upload`.
- **Payments:** `services/resource-purchases.ts` + `app/api/resources/[slug]/purchase`, `/purchase/verify`, `/purchase/manual`, `app/api/razorpay/resource-webhook` (separate from donations). Emailed receipt + re-download link; `/store/receipt/[id]`.
- **Reviews/bookmarks:** `services/resource-reviews.ts` (verified-buyer gate, moderation, rating aggregate) + `services/resource-bookmarks.ts`; routes + `review-form`/`bookmark-button`/`rating-stars`.
- **Admin:** Resources nav + pages (list/new/[id]/categories/purchases/reviews/settings) with `actions.ts`; components `resource-form` (protected file + preview images + tags + SEO + thesis fields), row-actions, categories manager, purchases table (UPI verify), reviews moderation, marketplace settings, analytics.
- **Public:** `/store` storefront (filters, featured, grid) + `/store/[slug]` detail (SEO + `resourceJsonLd` + reviews + buy/download), `loading.tsx`; "Store" added to nav + sitemap (incl. resource URLs).
- Verified: `typecheck`, `lint`, `build` all green (new routes compiled). New env: `RESEND_API_KEY`, `MARKETPLACE_FROM_EMAIL`, `BUYER_AUTH_SECRET`.

### Follow-ups
- **Apply migration `6_add_marketplace` to Neon + seed** (pending — needs explicit go-ahead): `npm run db:deploy && npm run db:seed`. Vercel `vercel-build` applies it automatically on deploy.
- Enable in Admin → Resources → Settings; set `RESEND_API_KEY` + `BUYER_AUTH_SECRET` for production magic-link/receipts; register the `/api/razorpay/resource-webhook` URL.
- Deferred (designed): AI resource tools, thesis library, exam-prep store + bundles, memberships, course marketplace (see `docs/MARKETPLACE.md`).
