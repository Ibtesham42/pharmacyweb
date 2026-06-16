import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { MediaType } from "@prisma/client";
import { requireAdmin } from "@/lib/session";
import { uploadProtected } from "@/lib/cloudinary";
import { createMedia } from "@/services/media";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/ratelimit";
import { errorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

// Server-side upload of the PROTECTED resource file (Cloudinary authenticated
// asset). Kept server-side so the file never gets a public URL.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File is too large (max 50MB)" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadProtected(buffer, { filename: file.name });

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
    const media = await createMedia({
      type: isPdf ? MediaType.PDF : MediaType.DOC,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      uploadedById: user.id,
    });

    void writeAudit({
      actorId: user.id,
      action: "UPLOAD",
      entityType: "Media",
      entityId: media.id,
      ip: clientIp(req.headers),
    });

    return NextResponse.json({
      id: media.id,
      fileName: media.fileName,
      size: media.size,
      fileType: isPdf ? "PDF" : ext,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
