import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { MagicLinkForm } from "@/components/public/magic-link-form";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Sign in",
  path: "/account/login",
  description: "Sign in to access your purchased and saved pharmacy resources.",
  noindex: true,
});

function safeNext(next?: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/account";
}

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const buyer = await getCurrentBuyer();
  if (buyer) redirect(safeNext(next));

  return (
    <div className="container max-w-md py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Sign in", path: "/account/login" }]} />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserRound className="h-5 w-5 text-primary" /> Your resources account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
              {error === "invalid"
                ? "That sign-in link was invalid or expired. Request a new one below."
                : "Too many attempts — please wait a minute and try again."}
            </p>
          )}
          <MagicLinkForm next={safeNext(next)} />
        </CardContent>
      </Card>
    </div>
  );
}
