import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { errorResponse } from "@/lib/api";

const schema = z.object({ path: z.string().startsWith("/").max(300) });

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    revalidatePath(parsed.data.path);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
