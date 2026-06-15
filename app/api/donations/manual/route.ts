import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { donationManualSchema } from "@/lib/validation";
import { getDonationById, submitManualRef } from "@/services/donations";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`donate-manual:${ip}`, 10, 60_000).success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = donationManualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { donationId, transactionRef } = parsed.data;

  const donation = await getDonationById(donationId);
  if (!donation) return NextResponse.json({ error: "Donation not found." }, { status: 404 });

  await submitManualRef(donationId, transactionRef);
  // Stays PENDING until an admin verifies the UPI transfer.
  return NextResponse.json({ ok: true, receiptUrl: `/donate/receipt/${donationId}` });
}
