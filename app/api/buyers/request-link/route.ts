import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buyerRequestLinkSchema } from "@/lib/validation";
import { requestLoginLink } from "@/services/buyers";
import { sendEmail } from "@/lib/mailer";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`buyer-link:${ip}`, 5, 60_000).success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = buyerRequestLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // honeypot

  const { token, code } = await requestLoginLink(d.email, d.name || undefined);
  // Link lands on a client page that signs the user into NextAuth via the magiclink provider.
  const link = absoluteUrl(
    `/account/verify?token=${encodeURIComponent(token)}${d.next ? `&next=${encodeURIComponent(d.next)}` : ""}`,
  );

  await sendEmail({
    to: d.email,
    subject: "Your PharmaCareers sign-in link",
    text: `Sign in to your PharmaCareers account.\n\nClick: ${link}\n\nOr enter this code: ${code}\n\nThis link and code expire in 15 minutes. If you didn't request this, ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
      <h2>Sign in to PharmaCareers</h2>
      <p>Click the button below to access your resources, purchases and downloads.</p>
      <p><a href="${link}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Sign in</a></p>
      <p>Or enter this code: <strong style="font-size:20px;letter-spacing:2px">${code}</strong></p>
      <p style="color:#666;font-size:13px">This link and code expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  });

  // Never reveal whether the email exists; the email (or dev log) carries the secret.
  return NextResponse.json({ ok: true });
}
