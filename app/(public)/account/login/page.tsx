import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Legacy path — magic-link is now a tab on the unified /login page.
export default async function AccountLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
}
