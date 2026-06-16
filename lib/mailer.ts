// Minimal transactional email via the Resend REST API (no SDK dependency —
// same fetch-based approach as lib/razorpay.ts). When RESEND_API_KEY is unset
// the message is logged server-side so magic-link / receipt flows stay testable
// in development.

const FROM = process.env.MARKETPLACE_FROM_EMAIL || "PharmaCareers <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Dev fallback: surface the content in server logs (never to the client).
    console.log(
      `\n──── [mailer:dev] ────\nTo: ${opts.to}\nSubject: ${opts.subject}\n${opts.text ?? opts.html}\n──────────────────────\n`,
    );
    return { ok: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Email send failed", res.status, detail);
      return { ok: false, error: `Email send failed (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    console.error("Email send error", e);
    return { ok: false, error: e instanceof Error ? e.message : "Email send failed" };
  }
}
