import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/session";

/** Map thrown errors to JSON responses for Route Handlers. */
export function errorResponse(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (err instanceof Error && err.message === "NOT_FOUND") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  console.error(err);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
