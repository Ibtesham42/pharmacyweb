# Donations & Support Platform

Voluntary donations to support the platform. Mobile-first, trustworthy, additive (no existing
functionality changed). Supports **Razorpay** (auto-verified) and **UPI/QR manual** (no gateway needed).

## Decisions
- **Payments:** Razorpay Checkout (signature + webhook verified) when keys exist; **plus** a UPI ID + QR
  manual flow (donor pays in their UPI app, submits a reference; admin verifies). UPI works immediately.
- **Receipts:** printable/downloadable receipt page (`window.print()` + `@media print`); email deferred.
- **Secrets:** `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` in **env only** — never
  in the DB or client (only the publishable `keyId` reaches the browser). Razorpay via REST + Node
  `crypto` (no SDK). **No new dependencies.**

## Code map
| Concern | Files |
|---|---|
| Config + types | `lib/donations/config.ts` (`DonationSettings`, defaults; in `SiteSetting` key `"donations"`) |
| Razorpay (server-only) | `lib/razorpay.ts` (order create, payment + webhook signature verify) |
| Validation (Zod) | `lib/validation.ts` (`donationCreateSchema`, `donationManualSchema`, `donationVerifySchema`, `donationSettingsSchema`) |
| Domain logic | `services/donations.ts` (create/markPaid/manual/stats/CSV/settings) |
| API | `app/api/donations/{create,verify,manual}/route.ts`, `app/api/razorpay/webhook/route.ts` |
| Public UI | `app/(public)/donate/page.tsx`, `donate/receipt/[id]/page.tsx`, `components/public/{donation-form,receipt-actions,donate-cta}.tsx` |
| Admin | `app/admin/(panel)/donations/{page,actions,export}`, `components/admin/{donation-settings-form,donations-table}.tsx` |
| DB | `prisma/schema.prisma` — `Donation` + `DonationStatus`/`DonationMethod` enums (migration `4_add_donations`) |

## Flows
- **Razorpay:** `/create` (PENDING + Razorpay order) → client Checkout → `/verify` (signature) → PAID →
  receipt. Webhook `payment.captured` marks PAID idempotently (source of truth).
- **UPI/QR:** `/create` (PENDING + UPI link/QR) → donor pays in their app → `/manual` submits the UTR →
  stays PENDING until an admin marks it Paid in Admin → Donations.
- **Receipt:** `/donate/receipt/[id]` (unguessable cuid); shows donor name (or "Anonymous"), amount,
  txn id, receipt no, date, Supporter badge; phone/email/address are never shown publicly.

## Security
Signature + webhook verification; keys env-only; per-IP rate limits on create/manual; honeypot; amount
min + cap; server-only status transitions; receipt-safe projection. Donor PII stored for receipts/admin.

## Admin
Admin → Donations: stat cards (total raised, donors, this month, avg, conversion), Donors table
(verify/reject manual), Overview (top supporters, by-source), Settings (enable, UPI ID, QR upload,
suggested/min amounts, goals, messages), CSV export.

## Placement
Footer "Support Us" link + homepage `DonateCta` (both gated by `enabled`), dedicated `/donate` page.
`?src=` records the placement for the by-source analytics.

## Go-live
1. Apply migration `4_add_donations` (Vercel `vercel-build` runs `migrate deploy` on push).
2. Admin → Donations → Settings: enable, set UPI ID + upload QR (for UPI). For Razorpay, set
   `RAZORPAY_KEY_ID`/`KEY_SECRET` (and `WEBHOOK_SECRET` + add the webhook URL `/api/razorpay/webhook`
   in the Razorpay dashboard) in Vercel, then redeploy.

## Future (design-only)
Recurring donations, monthly memberships, premium supporters, crowdfunding campaigns, community funding
goals — extend `Donation` (add `recurring`/a `Membership` model). Email receipts (add Resend).
