import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { signUpload, isCloudinaryConfigured } from "@/lib/cloudinary";
import { errorResponse } from "@/lib/api";

// Returns signed params so the admin client can upload directly to Cloudinary.
export async function POST() {
  try {
    await requireAdmin();
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 503 });
    }
    return NextResponse.json(signUpload({}));
  } catch (err) {
    return errorResponse(err);
  }
}
