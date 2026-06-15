// Client-side helper: signed direct upload to Cloudinary, then persist a Media
// record via our API. Keeps large files off serverless functions.

export interface UploadedMedia {
  id: string;
  url: string;
  type: string;
  fileName: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

export async function uploadToCloudinary(file: File): Promise<UploadedMedia> {
  const signRes = await fetch("/api/media/sign", { method: "POST" });
  if (signRes.status === 503) throw new Error("Cloudinary is not configured. Paste an image URL instead.");
  if (!signRes.ok) throw new Error("Not authorized to upload");
  const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

  const isImage = file.type.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", folder);

  const upRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: fd },
  );
  if (!upRes.ok) {
    let detail = "";
    try {
      const errJson = (await upRes.json()) as { error?: { message?: string } };
      detail = errJson?.error?.message ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(
      detail ? `Upload failed: ${detail}` : `Upload to Cloudinary failed (${upRes.status})`,
    );
  }
  const up = await upRes.json();

  const type = isImage ? "IMAGE" : file.type === "application/pdf" ? "PDF" : "DOC";
  const mediaRes = await fetch("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      url: up.secure_url,
      publicId: up.public_id,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      width: up.width,
      height: up.height,
    }),
  });
  if (!mediaRes.ok) throw new Error("Could not save media record");
  return mediaRes.json();
}

/** Register an externally-hosted image URL as a Media record (paste fallback). */
export async function registerExternalImage(url: string): Promise<UploadedMedia> {
  const res = await fetch("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "IMAGE",
      url,
      publicId: `external:${crypto.randomUUID()}`,
      fileName: url.split("/").pop()?.slice(0, 200) || "image",
      mimeType: "image/external",
      size: 0,
    }),
  });
  if (!res.ok) throw new Error("Could not save image URL");
  return res.json();
}

export const ACCEPT_IMAGE = "image/png,image/jpeg,image/webp,image/avif,image/gif";
export const ACCEPT_DOC = "application/pdf";
