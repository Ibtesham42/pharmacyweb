# CLAUDE.md — `app/` (Frontend + Routes)

Covers the public site, the admin area, and Route Handlers. Maps to the spec's "frontend" guide.

## Structure

- `app/(public)/` — public, indexable pages. SSR/ISR. Group route (no URL segment).
- `app/admin/` — protected. Gated by `middleware.ts` (redirect to `/admin/login` if not authed).
- `app/api/` — Route Handlers (REST) for client fetches, uploads, webhooks.
- AI assistant: `app/(public)/ai` (chat page), `app/admin/(panel)/ai` (settings), `app/api/ai/*` (streaming chat). See `docs/AI.md`.
- `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/feed.xml/route.ts` — SEO/PWA.

## Rendering rules

- **Server Components by default.** Add `"use client"` only for interactivity (forms, editor, menus).
- Public content pages: use `export const revalidate = <seconds>` (ISR) or tag-based revalidation; revalidate on publish via `revalidateTag`/`revalidatePath`.
- Never fetch via our own HTTP API from a Server Component — call `services/*` directly.
- Keep client bundles small (Lighthouse ≥ 95). Lazy-load heavy/below-the-fold widgets (ads, editor).

## SEO requirements (every public page)

- Implement `generateMetadata` (title, description, canonical, OpenGraph, Twitter).
- Add JSON-LD via a `<JsonLd>` component: `JobPosting` (jobs), `Article`/`NewsArticle` (articles/news), `BreadcrumbList`, plus site-level `Organization` + `WebSite`+`SearchAction`.
- Breadcrumbs visible + structured. Canonical absolute URL via `absoluteUrl()` from `lib/site.ts`.
- All images use `next/image` with `alt`. Use `priority` only for LCP image.

## UI / mobile-first

- TailwindCSS + shadcn/ui in `components/ui`. Compose page-specific UI in `components/public` and `components/admin`.
- Mobile-first: design at 360px first; large tap targets (min 44px); sticky search; bottom-safe spacing.
- Reusable: `PostCard`, `AdSlot`, `Breadcrumbs`, `SearchBar` (`compact` prop), `Pagination`, `EmptyState`, `ErrorState`, `CardSkeleton`/`CardGridSkeleton`, `ThemeToggle`, `BackToTop`, `DropdownMenu`.
- Dark mode: `next-themes` via `components/theme-provider.tsx` (in root layout); tokens in `globals.css` (`.dark`) + `darkMode:"class"`. Toggle with `ThemeToggle`.
- Route states: provide `loading.tsx` (skeletons) and `error.tsx` per public segment; `app/global-error.tsx` is the root fallback.
- Accessibility: semantic HTML, labels on inputs, focus states, WCAG AA contrast.

## Ads

- Use `<AdSlot slot="..." />`; placement/config driven by data (no hardcoded ad code in pages).
- Reserve space (fixed min-height) to avoid CLS. Load AdSense script lazily.

## Review checklist

- [ ] Server/Client boundary correct; minimal `"use client"`.
- [ ] `generateMetadata` + JSON-LD + canonical present.
- [ ] Mobile layout verified at 360px; tap targets OK.
- [ ] Images via `next/image` with alt; LCP image `priority`.
- [ ] No layout shift from ads/images.

---
_Last updated: 2026-06-15 — AI module (chat page, floating chat button, admin AI settings, streaming `/api/ai/chat`) + the UX pass (dark mode, loading/error states, etc.)._
