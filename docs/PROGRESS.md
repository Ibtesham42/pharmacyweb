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

## 2026-06-17 — Marketplace Phase 1: resume + go-live data step
- Resumed the Digital Resources Marketplace; reviewed all Phase-1 files and re-verified each layer before changing anything: `typecheck`, `lint`, `build` all green; `prisma validate` OK; `prisma migrate status` → **"Database schema is up to date"** (migration `6_add_marketplace` is **already applied** to Neon — the prior "pending apply" follow-up is now resolved, applied via deploy).
- Audited payments (Razorpay `/verify` signature + idempotent `resource-webhook`; UPI manual flow), secure delivery (entitlement check → ~90s signed Cloudinary URL + HMAC re-download tokens), buyer auth (hashed magic-link/OTP, httpOnly HMAC cookie), admin actions (requireAdmin + audit + revalidate) and analytics (`marketplaceAnalytics`) — all complete and correct; no stubs/TODOs in marketplace code.
- **Live-DB gap found + fixed:** `ResourceCategory` count was **0** (categories had never been seeded, though the `marketplace` SiteSetting existed). Seeded the 14 starter resource categories **surgically** (idempotent upsert of only `seedResourceCategories`) rather than running the full `npm run db:seed`, because `seedSettings()` upserts `homepage`/`contact` with `update:{value}` and would have clobbered any admin-customized values on prod. Verified: `ResourceCategory` count = 14.

### Follow-ups
- Remaining go-live steps are Vercel/admin config only (no code): set `RESEND_API_KEY` + `MARKETPLACE_FROM_EMAIL` + `BUYER_AUTH_SECRET`; register the `/api/razorpay/resource-webhook` URL; in Admin → Resources → Settings set UPI id/QR (store is already `enabled`). Then publish the first resources.
- Deferred (schema-ready): Phase 2 AI resource tools + analytics charts; Phase 3 thesis library, exam-prep bundles, memberships, course marketplace (see `docs/MARKETPLACE.md`).

## 2026-06-17 — Marketplace Phase 2: AI authoring tools
- Built an admin-only AI authoring assistant for marketplace resources (chosen as the next increment after Phase 1 was verified complete). Reuses the existing AI module — Groq provider (`lib/ai/groq.ts`), the career `structured<T>` pattern (generateObject → `generateText` markdown fallback), and `AiRequestLog` usage logging via `recordAssistantResult` — so **no new deps and no schema change**.
- **Tools:** from the resource's own title + description, generate **excerpt**, **SEO** (metaTitle + metaDescription) and **tags** (applied to the form fields), plus **MCQs** and **flashcards** (previewed, then inserted into the description as Markdown). Human-approval-before-publish — nothing auto-saves.
- **Files:** `lib/ai/resource-tools.ts` (Zod schemas + prompt builders), `services/ai/resource-tools.ts` (`generateExcerpt/generateSeo/suggestTags/generateMcqs/generateFlashcards` + shared `structured<T>`), `app/api/admin/resources/ai/route.ts` (admin-gated via `getCurrentUser` role check + per-IP rate-limit; checks AI `enabled`/`maintenanceMode` + `isGroqConfigured`), `components/admin/resource-ai-tools.tsx` (AI card wired into `resource-form.tsx`). New Zod `resourceAiSchema` in `lib/validation.ts`. Usage logged under features `RESOURCE_EXCERPT/SEO/TAGS/MCQ/FLASHCARD`.
- Verified: `typecheck`, `lint`, `build` all green.

### Follow-ups
- Requires Admin → AI Settings **enabled** + `GROQ_API_KEY` set (same as the rest of the AI module).
- Deferred: generate MCQs/flashcards directly from the **attached PDF** (fetch the authenticated Cloudinary asset → `extractText`); analytics charts; bookmarks UI polish.

## 2026-06-17 — Marketplace Phase 2: finished (PDF grounding + analytics charts + bookmarks)
- Completed the three remaining Phase-2 items (chosen via the "Finish Phase 2" steer).
- **PDF-grounded AI:** the resource AI tools can now generate from the **attached PDF/DOCX/TXT** instead of just the description. New `extractResourceFileText(fileId)` in `services/ai/resource-tools.ts` loads the `Media` row, builds a ~120s `signedDownloadUrl` for the authenticated Cloudinary asset, fetches the bytes and runs `lib/ai/extract.ts` (mime inferred from `fileName` when the stored mimeType is generic). The admin route accepts `{ useFile, fileId }`; `resourceAiSchema` now makes `text` optional when a file is used (refine). UI: a "Use attached file" checkbox in `resource-ai-tools.tsx` (shown only when a file is attached), wired from `resource-form.tsx`.
- **Admin analytics charts:** new `components/admin/marketplace-analytics.tsx` renders proportional pure-CSS bars (most-purchased by revenue, most-downloaded, revenue-by-category) from the existing `marketplaceAnalytics()` data; replaced the plain text rows on the Purchases tab. No charting dependency.
- **Bookmarks polish:** new client `components/public/saved-resources.tsx` — rich Saved cards (thumbnail/type/price/rating) with optimistic **unsave** (reuses the bookmark toggle route); account tabs now show counts. `listBuyerBookmarks` already returned the needed fields.
- Verified: `typecheck`, `lint` green; build run.

### Follow-ups
- Phase 3 remains: thesis library (`/library`), memberships/PREMIUM gating, exam-prep bundles (reserved `Order` tables).

## 2026-06-17 — Marketplace Phase 3 (start): Thesis & Research Library
- Started Phase 3 with the Thesis & Research Library (user-selected track). Additive — **no migration**; reuses the `RESEARCH_PAPER`/`THESIS` resource types and the existing `abstract`/`citation`/`doi`/`publishedYear` fields.
- **Public `/library`:** listing of research/thesis resources with **year** + **subject** filters and title/author/abstract search, research-oriented cards. New `app/(public)/library/{page,loading}.tsx`, `components/public/{research-card,research-filters}.tsx`. Service: `listResearchResources` + `getResearchYears` + `RESEARCH_RESOURCE_TYPES` in `services/resources.ts` (orderBy publishedYear desc NULLS LAST, then publishedAt).
- **Detail (canonical stays `/store/[slug]` — no duplicate URLs):** for research types the page now renders a **"How to cite"** block (copy citation + DOI link, `components/public/citation-block.tsx`), a publication-year meta row, a library-rooted breadcrumb, and **ScholarlyArticle** JSON-LD (`scholarlyArticleJsonLd` in `lib/seo.ts`) alongside the existing Product schema.
- Added **Library** to the header nav and `/library` to `sitemap.ts`.
- Verified: `typecheck`, `lint` green; build run.

### Follow-ups
- Phase 3 remaining: exam-prep store + bundles (reserved `Order`/`OrderItem` tables), memberships/PREMIUM subscriptions, course scaffolding.

## 2026-06-17 — Marketplace Phase 3: Exam-Prep Bundles
- Built the exam-prep bundles track (user-selected). Consistent with the marketplace decision: denormalized purchase row + `lib/razorpay` (NOT the dormant `Order` tables).
- **DB:** migration `7_add_bundles` (additive) — `Bundle`, `BundleItem` (join → `Resource`), `BundlePurchase` (mirrors `ResourcePurchase`). **Applied to Neon via `migrate deploy`** (verified: `migrate status` = up to date; tables queryable). Client regenerated.
- **Entitlement integration:** `hasEntitlement` now also matches a PAID `BundlePurchase` whose bundle contains the resource → the existing secure download route grants bundle items with no change.
- **Services:** `services/bundles.ts` (CRUD, public/admin lists, `getBundleBySlug` + `originalTotalPaise` for savings), `services/bundle-purchases.ts` (mirror of resource purchases; `hasBundlePurchase`, receipt email). `listSelectableResources` added to `services/resources.ts` for the picker.
- **Payments:** `app/api/bundles/[slug]/purchase`, `/purchase/{verify,manual}`, `app/api/razorpay/bundle-webhook` — reuse `purchaseCreate/Verify/Manual` Zod schemas + a **generalised `ResourcePurchaseForm`** (added optional endpoint-override props, backward-compatible).
- **Public:** `/exam-prep` (listing), `/exam-prep/[slug]` (contents + savings + buy/owned, per-item downloads when owned), `/exam-prep/receipt/[id]`, `loading.tsx`, `bundle-card.tsx`, `bundleJsonLd`. Bundle purchases surfaced in My Account; nav + sitemap updated.
- **Admin:** Resources → **Bundles** tab — list/new/[id]/purchases + `actions.ts`; `bundle-form` (searchable resource picker + cover + SEO), `bundle-row-actions`, `bundle-purchases-table` (UPI verify).
- Verified: `typecheck`, `lint`, `build` green (post-migration build has **zero** prisma errors; all `/exam-prep` + admin bundle routes compiled).

### Follow-ups
- Razorpay: register the `/api/razorpay/bundle-webhook` URL (reuses the donation keys/secret).
- Phase 3 remaining: memberships/PREMIUM (recurring subscriptions), course scaffolding.

## 2026-06-17 — Marketplace Phase 3: PREMIUM Memberships (final track)
- Completed the last Phase-3 track — PREMIUM memberships. Locked two design decisions with the user: **fixed-term passes** (one-time payment, no auto-renew — reuses the proven one-time Razorpay+UPI flow, not recurring Razorpay Subscriptions) and **all-access** (an active membership unlocks every paid + premium resource).
- **DB:** migration `8_add_memberships` (additive) — `MembershipPlan`, `Membership` (buyer window, `expiresAt`, unique buyerId), `MembershipPurchase` (mirrors `ResourcePurchase`). **Applied to Neon via `migrate deploy`** (verified queryable). Client regenerated.
- **Entitlement:** `hasEntitlement` now returns true for ANY resource while the buyer has an active membership (checked before per-resource/bundle lookups) → store detail, secure download route and bundles all honour membership with no extra wiring. PREMIUM resources become members-only (store detail shows a "Get PREMIUM" CTA replacing the old "coming soon").
- **Grant:** `grantMembershipForPurchase` runs on a real PENDING→PAID transition (verify/webhook/admin) — upserts `Membership`, extending from current expiry if still active, else from now.
- **Services:** `services/memberships.ts` (plan CRUD, `hasActiveMembership`, grant, `activeMemberCount`), `services/membership-purchases.ts` (mirror + receipt email).
- **Payments:** `app/api/membership/[planId]/purchase`, `/purchase/{verify,manual}`, `app/api/razorpay/membership-webhook` — reuse `purchaseCreate/Verify/Manual` schemas + the generalised `ResourcePurchaseForm` (planId in the path).
- **Public:** `/membership` (plans + join, `membership-plans.tsx`), `/membership/receipt/[id]`; My-Account status card. `durationLabel` lives in `lib/marketplace/config.ts` (shared, not the client module). Nav (“PREMIUM”) + sitemap updated.
- **Admin:** Resources → **Memberships** (plans manager + active-member count) + `/purchases` (UPI verify) + `actions.ts`; `membership-plans-manager`, `membership-purchases-table`.
- Verified: `typecheck`, `lint`, `build` green (post-migration build: zero prisma errors; all `/membership` + admin + API routes compiled). **Marketplace Phases 1–3 complete.**

### Follow-ups
- Razorpay: register the `/api/razorpay/membership-webhook` URL (reuses the donation keys/secret).
- Admin → Resources → Memberships: create at least one active plan to open `/membership`.
- Future (separate milestone): course marketplace (`Product.COURSE` + `Lesson/Enrollment/Certificate`); optional true recurring subscriptions.

## 2026-06-18 — Unified Authentication, Roles & Resource Access Control (Phase 1)
- Audited the codebase and found **two** auth systems (admin NextAuth `User` + passwordless cookie `Buyer`). Per approved plan (`docs/AUTH.md`), consolidated onto **one** NextAuth system; kept `Buyer` **bridged to `User` by email** (no FK migration) so the whole marketplace keeps working.
- **DB:** migration `9_add_user_auth` (additive) — recreated `Role` enum to add `USER` (transaction-safe rename+recreate, default `USER`), added `UserStatus`, `MembershipTier`, nullable `User.passwordHash`, `User.emailVerified/status`, `Buyer.userId` (+FK), `MembershipPlan.tier/benefits`, and `PasswordResetToken`. **Applied to Neon.** `10_user_role_default` is a **no-op** — Prisma orders migrations lexicographically so `"10" < "9"`; the default is set inside `9` and `10` is retained only for a clean ledger (recovered a failed first attempt via `migrate resolve --rolled-back`).
- **Auth core:** `lib/auth.ts` password + `magiclink` providers (reject null-hash/SUSPENDED); `lib/auth.config.ts` role-gated `authorized` (`/admin` → ADMIN/EDITOR only, USER redirected to `/account`; `/account` → any signed-in); `middleware.ts` matches `/admin` + `/account`; `lib/session.ts` `requireUser`; **`lib/buyer-session.ts` reimplemented as the NextAuth→Buyer bridge** (`getCurrentBuyer`/`requireBuyer`). `types/next-auth.d.ts` already carried `role`.
- **Services/validation:** `services/users.ts` (createUser, ensureUserForEmail, create/consumePasswordReset), `services/account.ts` changePassword made null-safe; reused for the public dashboard. New Zod `signup/forgot/reset` schemas.
- **Pages/API:** `/login` (password + email-link tabs), `/signup`, `/forgot-password`, `/reset-password`, `/account/verify`; `app/api/account/{signup,forgot-password,reset-password}`. Magic-link reworked to NextAuth (emailed link → `/account/verify` → `signIn`); removed `/api/buyers/{verify,logout}` + admin `LoginForm`; `/admin/login` + `/account/login` redirect to `/login`.
- **Protected downloads:** `app/api/resources/[slug]/download` now requires auth for **all** files; `components/public/download-gate.tsx` (new shadcn `ui/dialog.tsx`) gates guests on `/store/[slug]` + `/exam-prep/[slug]`.
- **Dashboard:** `/account` gained Profile (edit + change password) + Donation history tabs; sign-out via NextAuth; header account menu (`site-header` + layout pass `authed`/`isAdmin`).
- **Verified end-to-end (dev server):** auth pages 200; guest `/account` → `/login`; signup → role `USER`; credentials sign-in → session; authed `/account` 200; **USER → `/admin` redirected to `/account`**; password reset round-trip (token from dev mailer) → sign in with new password; **guest download → 307 `/login?next=…`**. `typecheck`/`lint`/`build` green; migration applied + schema up to date. All temp test data cleaned up.

### Follow-ups
- Phase 2: Saved Jobs/Articles (`PostBookmark`), AI chats linked to accounts, Notifications.
- Phase 3: Admin user management (suspend, grant/revoke Premium, activity) + membership tiers/benefits in the admin manager.
- Email verification is scaffolded (`User.emailVerified`) — enforce later. Set `RESEND_API_KEY` for live reset/magic-link emails (dev logs them to the console).

## 2026-06-18 — Auth Phase 2: saved content, linked AI chats, notifications
- **DB:** migration `11_add_saved_and_notifications` (additive, applied to Neon) — `PostBookmark` (saved jobs/articles/news by `User`), `Notification` + `NotificationType` enum, and `AiConversation.userId` (+ index, FK).
- **Saved jobs/articles:** `services/post-bookmarks.ts` (toggle/is/list); `app/api/posts/[slug]/bookmark` (GET state + POST toggle, auth-gated); `components/public/post-save-button.tsx` (self-fetches state so it's safe on the statically-rendered article/news pages) added next to the share buttons on the job page and in `ArticleDetail` (articles + news). Dashboard **Saved Jobs** / **Saved Articles** tabs.
- **Linked AI chats:** `recordUserMessage` now stamps `userId` (threaded from the session in `app/api/ai/chat`); `listUserConversations` powers the dashboard **AI Chats** tab.
- **Notifications:** `services/notifications.ts` (`notifyByEmail` resolves the User by email — no-op for guests); the resource/bundle/membership receipt functions create a PAID notification; dashboard **Notifications** tab (`components/public/notifications-panel.tsx`) + `POST /api/account/notifications/read` (mark-all-read).
- Verified end-to-end (dev): signup→session; bookmark GET `{signedIn:true}` → POST `{bookmarked:true}`; authed `/account` 200 (all tabs render); guest POST bookmark → 401. `typecheck`/`lint`/`build` green; migration applied (single pending — no lexicographic-ordering issue). Temp test data cleaned up.

### Follow-ups
- Phase 3: admin user management (suspend, grant/revoke Premium, activity) + membership tiers/benefits in the admin manager.
- Optional: header notification bell with unread count; deep-link AI Chats to reopen a specific conversation.
