// Marketplace identity bridge. Since unifying auth, the public session IS the
// NextAuth session (see lib/auth.ts). These helpers map the signed-in User to
// the marketplace `Buyer` (by email, via ensureBuyer) so every existing
// marketplace call site keeps working unchanged — no FK migration needed.

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensureBuyer } from "@/services/buyers";

/** The current buyer for the signed-in user, or null for guests. */
export async function getCurrentBuyer() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  return ensureBuyer(email, session.user.name ?? undefined);
}

/** Server-component guard: redirect guests to the unified /login, else return the buyer. */
export async function requireBuyer(nextPath?: string) {
  const buyer = await getCurrentBuyer();
  if (!buyer) {
    redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  }
  return buyer;
}
