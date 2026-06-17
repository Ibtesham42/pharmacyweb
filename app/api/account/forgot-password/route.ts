import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation";
import { createPasswordReset } from "@/services/users";
import { sendEmail } from "@/lib/mailer";
import { absoluteUrl } from "@/lib/site";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`forgot:${ip}`, 5, 60_000).success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // honeypot

  const token = await createPasswordReset(d.email);
  if (token) {
    const link = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);
    await sendEmail({
      to: d.email,
      subject: "Reset your PharmaCareers password",
      text: `Reset your password using this link (valid for 1 hour):\n\n${link}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
        <h2>Reset your password</h2>
        <p>Click below to choose a new password. This link expires in 1 hour.</p>
        <p><a href="${link}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    });
  }
  // Always succeed — never reveal whether an account exists.
  return NextResponse.json({ ok: true });
}
