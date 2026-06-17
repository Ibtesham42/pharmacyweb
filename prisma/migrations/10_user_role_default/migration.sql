-- No-op. The User.role default ('USER') is now set inside 9_add_user_auth, which
-- recreates the Role enum in a single transaction-safe step. This migration is
-- retained only because Prisma orders migrations lexicographically ("10" sorts
-- before "9"); keeping it as a no-op preserves a clean, ordered ledger.
SELECT 1;
