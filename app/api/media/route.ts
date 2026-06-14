import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MediaType } from "@prisma/client";
import { requireAdmin } from "@/lib/session";
import { createMedia, listMedia } from "@/services/media";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/ratelimit";
import { errorResponse } from "@/lib/api";

const createSchema = z.object({
  type: z.nativeEnum(MediaType),
  url: z.string().url(),
  publicId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  size: z.number().int().nonnegative(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  alt: z.string().max(300).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const typeParam = req.nextUrl.searchParams.get("type") as MediaType | null;
    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const result = await listMedia({ type: typeParam ?? undefined, page });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid media payload" }, { status: 400 });
    }
    const media = await createMedia({ ...parsed.data, uploadedById: user.id });
    void writeAudit({
      actorId: user.id,
      action: "UPLOAD",
      entityType: "Media",
      entityId: media.id,
      ip: clientIp(req.headers),
    });
    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
