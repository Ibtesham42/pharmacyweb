import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { AuthSignUpForm } from "@/components/public/auth-signup-form";
import { getCurrentUser } from "@/lib/session";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Create your account",
  path: "/signup",
  description: "Create a free PharmaCareers account to download resources, save jobs and articles, and manage purchases.",
  noindex: true,
});

function safeNext(next?: string): string | undefined {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; callbackUrl?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next ?? sp.callbackUrl);
  const user = await getCurrentUser();
  if (user) redirect(next ?? "/account");

  return (
    <div className="container max-w-md py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Create account", path: "/signup" }]} />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-5 w-5 text-primary" /> Create your account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuthSignUpForm next={next} />
        </CardContent>
      </Card>
    </div>
  );
}
