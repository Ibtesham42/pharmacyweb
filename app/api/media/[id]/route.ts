import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { deleteMedia } from "@/services/media";
import { writeAudit } from "@/lib/audit";
import { errorResponse } from "@/lib/api";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    await deleteMedia(id);
    void writeAudit({ actorId: user.id, action: "DELETE", entityType: "Media", entityId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
