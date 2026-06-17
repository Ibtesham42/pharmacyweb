import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { purchaseManualSchema } from "@/lib/validation";
import { getMembershipPurchaseById, submitManualRef } from "@/services/membership-purchases";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`membership-manual:${ip}`, 10, 60_000).success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = purchaseManualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { purchaseId, transactionRef } = parsed.data;

  const purchase = await getMembershipPurchaseById(purchaseId);
  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  await submitManualRef(purchase.id, transactionRef);
  // Stays PENDING until an admin verifies the UPI payment, which grants membership.
  return NextResponse.json({ receiptUrl: `/membership/receipt/${purchase.id}` });
}
