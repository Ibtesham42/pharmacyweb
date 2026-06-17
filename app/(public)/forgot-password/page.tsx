import { KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ForgotPasswordForm } from "@/components/public/forgot-password-form";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Forgot password",
  path: "/forgot-password",
  description: "Reset your PharmaCareers account password.",
  noindex: true,
});

export default function ForgotPasswordPage() {
  return (
    <div className="container max-w-md py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Forgot password", path: "/forgot-password" }]} />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="h-5 w-5 text-primary" /> Forgot your password?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
