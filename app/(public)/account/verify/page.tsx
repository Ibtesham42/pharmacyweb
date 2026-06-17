import { MagicVerify } from "@/components/public/magic-verify";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "Signing in…", path: "/account/verify", noindex: true });

function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const { token, next } = await searchParams;
  return (
    <div className="container max-w-md py-20 text-center">
      <MagicVerify token={token} next={safeNext(next)} />
    </div>
  );
}
