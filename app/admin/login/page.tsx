import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Consolidated into the single platform sign-in page. Admins sign in at /login
// and are routed to /admin by role.
export default async function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const target = sp.callbackUrl ?? sp.next ?? "/admin";
  redirect(`/login?next=${encodeURIComponent(target)}`);
}
