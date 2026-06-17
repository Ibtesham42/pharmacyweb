# Authentication, Roles & Resource Access Control

One unified auth system for the whole platform (public users + admins), built on **Auth.js (NextAuth v5, JWT)**.
Phase 1 (this doc) ships sign-up/in, forgot/reset password, profile + change-password, magic-link, role-based
access, protected downloads, and a user dashboard. Saved jobs/articles, linked AI chats, notifications and
admin user-management are Phases 2–3 (see Roadmap below).

## Consolidation (why one system)
Previously there were **two** auth systems: admin NextAuth (`User`) and a passwordless cookie session for
marketplace buyers (`Buyer`). They are now unified on NextAuth/`User`. The `Buyer` table is **retained** and
**bridged to `User` by email** — so the entire marketplace (purchases, downloads, memberships, bookmarks,
reviews, all keyed by `buyerId`/email) keeps working with **no FK migration**.

- Bridge: `lib/buyer-session.ts` `getCurrentBuyer()` / `requireBuyer()` now read the NextAuth session
  (`auth()`) and `ensureBuyer(email)` (`services/buyers.ts`) → return the `Buyer`. Every existing call site is unchanged.
- `Buyer.userId` links the rows explicitly; `createUser`/`ensureUserForEmail` attach any pre-existing Buyer by email.

## Roles & tiers
- Stored on `User.role`: `ADMIN`, `EDITOR`, `USER` (public signups default to **USER**). `User.status` = `ACTIVE | SUSPENDED`.
- **Guest** = no session. **Registered** = `USER`. **Premium/VIP** are **derived at runtime** from an active
  `Membership` tier (`MembershipPlan.tier` = FREE/PREMIUM/VIP) — not stored roles. **Admin/Editor** = `ADMIN`/`EDITOR`.
- Gating (`lib/auth.config.ts authorized`): `/admin/*` requires ADMIN/EDITOR (a signed-in USER is redirected to
  `/account`); `/account/*` requires any signed-in user; `middleware.ts` matches `["/admin/:path*","/account/:path*"]`.

## Sign-in methods
- **Password** — `credentials` provider in `lib/auth.ts` (rejects null-hash / SUSPENDED users).
- **Magic-link / OTP** — `magiclink` provider re-verifies + consumes a `BuyerAuthToken` (`verifyLogin`), upserts a
  `User`, and yields a NextAuth session. The emailed link lands on `/account/verify` (client) → `signIn("magiclink")`;
  the OTP code path calls `signIn("magiclink", { email, code })`.

## Pages & API
| Concern | Files |
|---|---|
| Pages | `app/(public)/{login,signup,forgot-password,reset-password}/page.tsx`, `/account` (dashboard), `/account/verify` |
| Forms | `components/public/{auth-signin-form,auth-signup-form,forgot-password-form,reset-password-form,magic-link-form,magic-verify,profile-form}.tsx` |
| API | `app/api/account/{signup,forgot-password,reset-password}`; NextAuth `app/api/auth/[...nextauth]`; `app/api/buyers/request-link` (emails the magic link/OTP) |
| Services | `services/users.ts` (createUser, ensureUserForEmail, create/consumePasswordReset), `services/account.ts` (updateProfile, changePassword) |
| Session helpers | `lib/session.ts` (`getCurrentUser`, `requireUser`, `requireAdmin`), `lib/buyer-session.ts` (marketplace bridge) |
| Header | `app/(public)/layout.tsx` passes `authed`/`isAdmin` → `components/public/site-header.tsx` (account menu / Sign in) |
| DB | migration `9_add_user_auth` (`10_user_role_default` is a no-op — see note) |

Legacy `/admin/login` and `/account/login` now **redirect to `/login`** (single sign-in page); the old admin
`LoginForm` and the buyer cookie routes (`/api/buyers/{verify,logout}`) were removed.

## Resource access control (protected downloads)
`app/api/resources/[slug]/download/route.ts`: **no file is downloadable without authentication.** A signed-in
user (or a valid signed re-download token) is required for FREE *and* PAID resources; guests are redirected to
`/login?next=…`. Entitlement (`hasEntitlement`) then allows FREE for any signed-in user, and PAID/PREMIUM only
with a purchase, bundle, or active membership. Files stay Cloudinary **authenticated** assets served via
~90s expiring signed URLs.
- **Guest UX:** `components/public/download-gate.tsx` (shadcn Dialog) replaces the Download/Buy button for guests
  on `/store/[slug]` and `/exam-prep/[slug]` — "Please sign in or create an account…" with Sign in / Create
  account buttons that return to the resource via `?next=`.

## Dashboard (`/account`)
Tabs: **Profile** (edit name + change password; email is read-only to protect the marketplace bridge),
**Purchases** (resources + bundles, re-download + receipts), **Saved** (bookmarked resources), **Downloads**,
**Donations** (history by email). A membership-status card shows PREMIUM state + expiry. Sign-out uses NextAuth.

## Security
JWT sessions + bcrypt; SUSPENDED + null-hash rejected at `authorize`; rate-limit + honeypot on
signup/forgot/reset/request-link; hashed single-use `PasswordResetToken` (1h); no account enumeration on
forgot-password; protected downloads via session + entitlement + expiring signed URLs.

## Migration note
Prisma orders migrations **lexicographically**, so `"10_…"` sorts before `"9_…"`. `9_add_user_auth` therefore
recreates the `Role` enum (adding `USER`) in a single transaction-safe step and sets the `USER` default itself;
`10_user_role_default` is a harmless no-op kept only to preserve a clean ledger.

## Roadmap
- **Phase 2:** Saved Jobs/Articles (`PostBookmark`), AI chats linked to the account, in-app Notifications.
- **Phase 3:** Admin user management (`/admin/users`: suspend/reactivate, grant/revoke Premium, activity), and
  membership tiers/benefits surfaced in the admin plans manager + `/membership`.
- Email verification is scaffolded (`User.emailVerified`) and can be enforced later.
