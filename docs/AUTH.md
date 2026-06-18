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
- **Purchases require auth (server-side).** `/api/{membership/[planId],resources/[slug],bundles/[slug]}/purchase`
  call `getCurrentBuyer()` → `401` for guests, and key the purchase on the **session** buyer id/email (never a
  body-supplied email) — so a purchase/membership is always assigned to the authenticated account. The
  membership page gates guests with a "Sign in to go PREMIUM" link (plans stay viewable).
- **Idempotent payments.** `markPaid`/`adminSet*Status` return `true` only on the first PAID transition
  (`updateMany … where status≠PAID`); receipt email, in-app notification and membership grant each fire exactly
  once across `/verify` + webhook + admin retries (no duplicate emails, notifications or membership extensions).

## PREMIUM membership — admin approval workflow
Payment **never** activates PREMIUM by itself. Flow: sign in → pay (Razorpay or UPI) → membership recorded as
**Pending Verification** → admin reviews → **Approve** activates (sets the window) / **Reject** / **Suspend** /
**Extend**. Migration `12_membership_approval` adds `MembershipStatus {PENDING APPROVED REJECTED SUSPENDED
EXPIRED}`, `Membership.status` (+ nullable `expiresAt`, `purchaseId`, `reviewedAt/ById`), and
`MembershipPurchase.membershipStatus`.
- **Entitlement gate:** `hasActiveMembership` = `status=APPROVED && expiresAt>now` — so Pending/Rejected/
  Suspended/Expired never unlock premium/all-access (everything downstream of `hasEntitlement` inherits this).
- **Services (`services/memberships.ts`):** `requestMembershipForPurchase` (PENDING on first PAID transition, no
  activation; a live renewal is left untouched), `approveMembershipPurchase`/`rejectMembershipPurchase`
  (per-purchase), `suspendMembership`/`extendMembership` (per-buyer; reused by the `/admin/users` comp grant/revoke).
- **Admin "Membership Verification"** (`/admin/resources/memberships/purchases`): user name/email/**User ID**/plan/
  amount/**transaction id**/method/purchase date/payment + **verification** status, with Approve/Reject/Suspend/
  Extend/Payment-details and a pending-count badge.
- **Dashboard:** the `/account` membership card shows Plan · Status · Purchase Date · Approval Status · Expiry.
- **Emails:** "payment received — pending verification" on pay; "PREMIUM activated" on approve.

## Migration note
Prisma orders migrations **lexicographically**, so `"10_…"` sorts before `"9_…"`. `9_add_user_auth` therefore
recreates the `Role` enum (adding `USER`) in a single transaction-safe step and sets the `USER` default itself;
`10_user_role_default` is a harmless no-op kept only to preserve a clean ledger.

## Phase 2 — saved content, linked AI chats, notifications (shipped)
Migration `11_add_saved_and_notifications` adds `PostBookmark` (saved jobs/articles/news, keyed by `User`),
`Notification` (+ `NotificationType`), and `AiConversation.userId`.
- **Save jobs/articles:** `components/public/post-save-button.tsx` (self-fetches state via `GET/POST
  /api/posts/[slug]/bookmark`, so it works on statically-rendered post pages) on job + article/news pages;
  `services/post-bookmarks.ts`; dashboard **Saved Jobs** / **Saved Articles** tabs.
- **Linked AI chats:** the chat route stamps `userId` on the conversation when signed in
  (`recordUserMessage`); dashboard **AI Chats** tab via `listUserConversations`.
- **Notifications:** `services/notifications.ts` (`notifyByEmail`); the resource/bundle/membership receipt
  functions create a notification on PAID; dashboard **Notifications** tab + `POST /api/account/notifications/read`.

## Phase 3 — admin user management + membership tiers (shipped)
Code-only (uses `User.status` + `Membership` + `MembershipPlan.tier/benefits` from migration `9`).
- **`/admin/users`** (list + role/status filters + search) and **`/admin/users/[id]`** (activity: purchase/
  download/membership counts + recent downloads). `services/admin-users.ts` (`listUsers`, `getUserDetail`,
  `setUserStatus`). Admin nav gains **Users**.
- **Actions** (`app/admin/(panel)/users/actions.ts`, requireAdmin + audit): suspend/reactivate
  (`setUserStatusAction` — can't suspend an ADMIN or yourself; suspended users are rejected at `authorize`),
  grant/extend & revoke comp PREMIUM (`grantCompMembership`/`revokeMembership` in `services/memberships.ts`,
  by email → bridged Buyer). UI: `components/admin/user-admin-actions.tsx`.
- **Membership tiers/benefits:** `MembershipPlan.tier` (FREE/PREMIUM/VIP) + `benefits[]` are now editable in
  `components/admin/membership-plans-manager.tsx` and shown on the `/membership` plan cards.

## Phase 3 follow-up — header notification bell (shipped)
A **bell** in the public header (signed-in users only) with a live unread badge and a dropdown of the latest
notifications. Self-fetching client `components/public/notification-bell.tsx` reads `GET
/api/account/notifications` (`getCurrentUser`-gated → `{ unread, items }` via `listNotifications` +
`unreadNotificationCount`) on mount and on open; **Mark all read** reuses `POST
/api/account/notifications/read`; **View all** links to `/account`. A matching **Notifications** link sits in the
mobile menu. No migration / new deps.

## Roadmap
- Email verification is scaffolded (`User.emailVerified`) and can be enforced later. Deep-linking the AI Chats
  list (and the bell's "View all") to select a specific account tab via URL is a possible follow-up.
