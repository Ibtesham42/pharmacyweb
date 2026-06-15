import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  listConversationsForClient,
  deleteAllConversations,
  deleteConversation,
} from "@/services/ai/conversations";

export const dynamic = "force-dynamic";

/** List the calling browser's own conversations: /api/ai/conversations?clientId=... */
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId || clientId.length < 8) {
    return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }
  const conversations = await listConversationsForClient(clientId);
  return NextResponse.json({ conversations });
}

/** Delete one (?id=) or all of the client's conversations (clear chat). */
export async function DELETE(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  const id = req.nextUrl.searchParams.get("id");
  if (!clientId || clientId.length < 8) {
    return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }
  if (id) {
    const ok = await deleteConversation(id, clientId);
    return NextResponse.json({ ok });
  }
  const count = await deleteAllConversations(clientId);
  return NextResponse.json({ ok: true, count });
}
