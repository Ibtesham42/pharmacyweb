import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { AuthSignInForm } from "@/components/public/auth-signin-form";
import { MagicLinkForm } from "@/components/public/magic-link-form";
import { getCurrentUser } from "@/lib/session";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Sign in",
  path: "/login",
  description: "Sign in to your PharmaCareers account to download resources, track purchases and more.",
  noindex: true,
});

function safeNext(next?: string): string | undefined {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; callbackUrl?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next ?? sp.callbackUrl);
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" || user.role === "EDITOR" ? "/admin" : next ?? "/account");

  return (
    <div className="container max-w-md py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Sign in", path: "/login" }]} />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <LogIn className="h-5 w-5 text-primary" /> Sign in
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password">
            <TabsList className="mb-4">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="magic">Email link</TabsTrigger>
            </TabsList>
            <TabsContent value="password">
              <AuthSignInForm next={next} />
            </TabsContent>
            <TabsContent value="magic">
              <MagicLinkForm next={next ?? "/account"} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
