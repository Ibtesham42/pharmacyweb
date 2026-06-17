# Digital Resources Marketplace & Education Store

A marketplace for downloadable pharmacy resources (notes, PYQs, GPAT/NIPER/Drug-Inspector material,
thesis, e-books, mock tests…), supporting **free** and **paid** downloads with secure delivery, buyer
accounts, purchase history, and moderated reviews. Phase 1 (MVP) is implemented; later phases add AI
tools, a thesis library, an exam-prep store, memberships and course infrastructure (see Roadmap below).

## Decisions
- **Dedicated `Resource` model** (not the legacy `Product` scaffold) — richer fields (type taxonomy,
  access tier, file metadata, previews, ratings, thesis fields). `Product/Order/OrderItem/Payment`
  stay reserved for the future multi-item cart / course layer.
- **Purchases mirror Donations** — `ResourcePurchase` is a single denormalized row + Razorpay fields,
  reusing `lib/razorpay.ts`. The proven donations flow, not the unwired `Order` tables.
- **Passwordless buyer accounts** — email **magic-link / OTP**, separate from admin NextAuth. Buyer
  session is an HMAC-signed httpOnly cookie (`lib/buyer-session.ts`); **admin auth + middleware are
  untouched**. Buyer-gated pages call `requireBuyer()` server-side.
- **Secure delivery** — paid files are Cloudinary **authenticated** assets. The download route verifies
  entitlement (session buyer or signed token) then 302-redirects to a freshly-signed, ~90s-expiring
  URL. The storage URL is never exposed.
- **Email via Resend REST over `fetch`** (no SDK dep); dev fallback logs the link/code to the console.
- **No new dependencies.** Tokens/sessions signed with Node `crypto` HMAC.

## Data model (migration `6_add_marketplace`)
Enums: `ResourceType` (15), `ResourceAccess` (FREE/PAID/PREMIUM), `ResourceStatus`, `ReviewStatus`.
Models: `ResourceCategory`, `Resource`, `ResourceTag` (reuses `Tag`), `Buyer`, `BuyerAuthToken`
(hash-only), `ResourcePurchase`, `ResourceReview`, `ResourceBookmark`, `ResourceDownload`.
Config in `SiteSetting` key `"marketplace"`. Migration is **additive** (no existing tables changed) and
backfills nothing; seed adds 14 starter categories + create-only marketplace settings.

## Code map
| Concern | Files |
|---|---|
| Config + types | `lib/marketplace/config.ts` (settings, labels, `avgRating`, `formatBytes`, levels) |
| Cloudinary | `lib/cloudinary.ts` → `uploadProtected`, `signedDownloadUrl` |
| Buyer auth | `lib/buyer-session.ts`, `lib/mailer.ts`, `services/buyers.ts`, `app/api/buyers/*`, `app/(public)/account/*` |
| Secure delivery | `lib/download-token.ts`, `app/api/resources/[slug]/download/route.ts` |
| Validation (Zod) | `lib/validation.ts` (`resourceSchema`, `resourceCategorySchema`, `purchase*Schema`, `reviewSchema`, `buyer*Schema`, `marketplaceSettingsSchema`) |
| Domain logic | `services/{resources,resource-categories,resource-purchases,resource-reviews,resource-bookmarks,marketplace-settings}.ts` |
| Payments API | `app/api/resources/[slug]/purchase`, `app/api/resources/purchase/{verify,manual}`, `app/api/razorpay/resource-webhook`, `app/api/admin/resources/upload` |
| Public UI | `app/(public)/store/{page,[slug]/page,receipt/[id]/page}.tsx`, `components/public/{resource-card,resource-filters,rating-stars,review-form,bookmark-button,resource-purchase-form,magic-link-form,account-logout-button}.tsx` |
| Admin UI | `app/admin/(panel)/resources/*`, `components/admin/{resource-form,resource-file-upload-field,resource-row-actions,resource-categories-manager,resource-purchases-table,resource-reviews-table,resource-admin-tabs,marketplace-settings-form}.tsx` |
| DB | `prisma/schema.prisma` + migration `6_add_marketplace`; seed in `prisma/seed.ts` |

## Flows
- **Free download:** `/store/[slug]` → Download → `/api/resources/[slug]/download` checks
  `freeRequiresAccount`, records the download, redirects to a signed expiring URL.
- **Paid (Razorpay):** purchase route creates a PENDING `ResourcePurchase` + Razorpay order → Checkout
  → `/verify` (signature) → PAID → unlock + emailed receipt/re-download link. `resource-webhook`
  marks PAID idempotently as a backup.
- **Paid (UPI manual):** purchase route returns UPI link/QR → buyer submits UTR via `/manual` → stays
  PENDING until an admin marks it paid (which emails the receipt + unlocks).
- **Reviews:** verified buyers (paid, or downloaded for free) submit a rating/review → PENDING →
  admin approves → counts toward the denormalized `ratingSum/ratingCount`.
- **Account:** `/account/login` (magic-link/OTP) → `/account` dashboard: Purchases (re-download),
  Saved, Downloads.

## Security & privacy
Authenticated Cloudinary assets + entitlement-checked, expiring signed URLs; HMAC tokens; auth tokens
stored hashed; httpOnly SameSite buyer cookie; Razorpay secrets server-only; receipts/public views
never expose email/phone/IP/payment internals; rate-limit + honeypot on public POSTs; reviews moderated.

## Go-live
1. Apply migration `6_add_marketplace` (Vercel `vercel-build` runs `migrate deploy`) and seed categories.
2. Set `RESEND_API_KEY` + `MARKETPLACE_FROM_EMAIL` + `BUYER_AUTH_SECRET` in Vercel (magic-link &
   receipts). Without Resend, links are console-logged (dev only).
3. Admin → Resources → Settings: enable the store, set UPI id/QR (for the paid fallback). Razorpay
   reuses the donation keys; register the extra webhook URL `/api/razorpay/resource-webhook`.

## Phase 2 — AI authoring tools (shipped 2026-06-17)
Admin-only AI assist in the resource editor, reusing the AI module's Groq provider + `structured<T>`
(generateObject → markdown fallback) + `AiRequestLog` usage logging. From the resource's own
**title + description** (no extra upload), one click generates:
- **excerpt**, **SEO** (metaTitle + metaDescription) and **tags** → applied straight to the form fields;
- **MCQs** and **flashcards** → previewed, then inserted into the description as Markdown.
Nothing auto-saves — the admin reviews/edits before publishing. Files: `lib/ai/resource-tools.ts`
(schemas + prompts), `services/ai/resource-tools.ts` (domain + `extractResourceFileText`), `app/api/admin/resources/ai/route.ts`
(admin-gated; checks AI `enabled` + `GROQ_API_KEY` + light per-IP rate-limit), `components/admin/resource-ai-tools.tsx`
(in `resource-form.tsx`). Gated on Admin → AI Settings being enabled with a configured key.
- **Grounding source:** tools use the title + description by default, or — via a "Use attached file"
  toggle — the **attached PDF/DOCX/TXT**: the route fetches the authenticated Cloudinary asset through a
  short-lived signed URL and runs `lib/ai/extract.ts` (`extractResourceFileText`) so MCQs/flashcards are
  grounded in the real document.
- **Admin analytics charts:** the Purchases tab renders proportional bar charts (most-purchased by
  revenue, most-downloaded, revenue-by-category) via `components/admin/marketplace-analytics.tsx`
  (pure-CSS bars off `marketplaceAnalytics()` — no chart dependency).
- **Bookmarks UX:** `components/public/saved-resources.tsx` powers the account **Saved** tab — rich cards
  (thumbnail/type/price/rating) with optimistic **unsave**; the three account tabs now show counts.

## Phase 3 — Thesis & Research Library (shipped 2026-06-17)
A dedicated `/library` view over the existing `RESEARCH_PAPER` + `THESIS` resources (reusing the
`abstract`/`citation`/`doi`/`publishedYear` fields — **no migration**). Listing with **year** + **subject**
filters and title/author/abstract search (`listResearchResources` + `getResearchYears`,
`RESEARCH_RESOURCE_TYPES` in `services/resources.ts`); `components/public/{research-card,research-filters}.tsx`.
Detail pages stay canonical at `/store/[slug]` (no duplicate URLs) but, for research types, gain a
**"How to cite"** block with copy + DOI link (`components/public/citation-block.tsx`), a publication-year
meta row, a library-rooted breadcrumb, and **ScholarlyArticle** JSON-LD (`scholarlyArticleJsonLd` in
`lib/seo.ts`) alongside the Product schema. Added to the header nav + `sitemap.ts`.

## Roadmap (deferred, schema-ready)
- **Phase 3 (remaining):** Exam-prep store (`/exam-prep`, bundles via the reserved `Order` tables),
  memberships/subscriptions (PREMIUM gating), course marketplace scaffolding (`Product.COURSE` +
  future `Lesson/Enrollment/Certificate`).
