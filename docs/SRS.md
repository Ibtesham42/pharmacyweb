# Software Requirements Specification — Pharmacy Job Portal & Medical Content Platform

_Last updated: Phase 2._

## 1. Purpose & Scope
A mobile-first, SEO-first web platform for discovering pharmacy/medical jobs and consuming medical news, articles, and study material — with a future store for courses and paid PDFs. Single admin publishes content. Audience: pharmacy students, pharmacists, medical reps, healthcare professionals, job seekers (India-focused).

## 2. Users & Roles
- **Public Visitor** — browse/search jobs & content, view categories, read posts, click external apply links, share, view ads. No content creation, no admin.
- **Admin** (role-extensible to EDITOR) — secure login; full CRUD on posts/jobs/news; schedule; upload images/PDFs/docs; manage categories, tags, ads, SEO, homepage; view analytics; audit trail.

## 3. Functional Requirements
### 3.1 Content
- FR-1 Content types: Job, Medical News, Blog Article (MVP); Course, PDF Product (future, schema only).
- FR-2 Job fields: title, company, location (state/city), job type, salary, description, apply link, expiry, featured image, tags, SEO.
- FR-3 News fields: headline, content, images, references, tags, SEO.
- FR-4 Article fields: title, rich text/markdown, images, embedded video, PDF attachments, references, SEO.
- FR-5 Posts have status: DRAFT / SCHEDULED / PUBLISHED / ARCHIVED; soft delete.

### 3.2 Admin
- FR-6 Secure login (credentials + JWT), rate-limited.
- FR-7 Editor: rich text + markdown, image drag-drop upload, PDF/doc upload, video/URL embed, preview, autosave drafts, schedule publish, per-post SEO panel.
- FR-8 Manage categories (nested), tags, advertisements, SEO defaults, homepage content, media library.
- FR-9 Dashboard analytics: total posts, total jobs, most-viewed, search trends, visitor stats, ad performance, top categories.
- FR-10 Audit log of admin actions.

### 3.3 Public site
- FR-11 Pages: Home, Jobs (list/detail), Articles (list/detail), News (list/detail), Categories, Search, About, Contact, Privacy, Terms, Advertise, Future Store/Courses (scaffold).
- FR-12 Full-text search by title, company, state, city, category, tags, keywords (Postgres FTS + fuzzy).
- FR-13 Outbound apply-link tracking; share; related content; breadcrumbs.
- FR-14 Ad slots: homepage top, between content, sidebar, footer, job pages (config-driven).

### 3.4 SEO
- FR-15 Sitemap, robots, canonical URLs, slugs, breadcrumbs, RSS.
- FR-16 Metadata, OpenGraph, Twitter cards, JSON-LD structured data; Google Discover ready.

## 4. Non-Functional Requirements
- NFR-1 Mobile-first; Lighthouse mobile ≥ 95; Core Web Vitals "Good".
- NFR-2 PWA installable; offline shell.
- NFR-3 Security: secure auth, RBAC, CSRF, XSS protection, rate limiting, input validation, secure uploads, security headers/CSP.
- NFR-4 Accessibility WCAG AA.
- NFR-5 Maintainability: layered architecture (app/services/lib), typed, documented, tested.
- NFR-6 Scalability/cost: serverless (Vercel + Neon), CDN media (Cloudinary), ISR caching.

## 5. Future (architecture-ready, not in MVP)
Paid PDFs, online courses, payments (Razorpay-first), featured/sponsored listings, banner ads, affiliate, newsletter; AI modules (article generation, SEO suggestions, job summaries, resume review, career guidance) behind a provider-agnostic interface.

## 6. Constraints & Assumptions
- Single admin initially. India region (INR, Indian states/cities).
- Hosting: Vercel; DB: Neon Postgres; Media: Cloudinary.
- No Docker in dev environment; Node 21 / npm 10.
