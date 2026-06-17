import { KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ResetPasswordForm } from "@/components/public/reset-password-form";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Reset password",
  path: "/reset-password",
  description: "Choose a new password for your PharmaCareers account.",
  noindex: true,
});

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="container max-w-md py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Reset password", path: "/reset-password" }]} />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="h-5 w-5 text-primary" /> Set a new password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
