import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUDINARY_FOLDER = "pharmacy-portal";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Generate a signature so the admin client can upload directly to Cloudinary
 * (keeps large files off our serverless functions and hides the API secret).
 */
export function signUpload(params: Record<string, string | number>) {
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = { timestamp, folder: CLOUDINARY_FOLDER, ...params };
  const signature = cloudinary.utils.api_sign_request(
    toSign,
    process.env.CLOUDINARY_API_SECRET as string,
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: CLOUDINARY_FOLDER,
  };
}

/** Server-side buffer upload (used for small/programmatic uploads). */
export function uploadBuffer(
  buffer: Buffer,
  options: { resourceType?: "image" | "raw" | "auto"; filename?: string } = {},
): Promise<{
  secure_url: string;
  public_id: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
  resource_type: string;
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: options.resourceType ?? "auto",
        filename_override: options.filename,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result as never);
      },
    );
    stream.end(buffer);
  });
}

export async function deleteAsset(publicId: string, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Upload a PROTECTED file (Cloudinary "authenticated" delivery type). The asset
 * is NOT publicly reachable — it can only be served via a freshly-signed,
 * time-limited URL from `signedDownloadUrl()`. Used for paid resource files.
 */
export function uploadProtected(
  buffer: Buffer,
  options: { filename?: string } = {},
): Promise<{
  secure_url: string;
  public_id: string;
  bytes: number;
  format?: string;
  resource_type: string;
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${CLOUDINARY_FOLDER}/protected`,
        resource_type: "raw",
        type: "authenticated",
        use_filename: true,
        unique_filename: true,
        filename_override: options.filename,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result as never);
      },
    );
    stream.end(buffer);
  });
}

/**
 * Generate a short-lived, signed delivery URL for an authenticated asset.
 * The signature embeds `expires_at`, so the link stops working after the TTL.
 * `flags: attachment` forces a download rather than inline view.
 */
export function signedDownloadUrl(
  publicId: string,
  options: { expiresInSec?: number; resourceType?: "raw" | "image"; download?: boolean } = {},
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + (options.expiresInSec ?? 60);
  return cloudinary.url(publicId, {
    resource_type: options.resourceType ?? "raw",
    type: "authenticated",
    secure: true,
    sign_url: true,
    expires_at: expiresAt,
    ...(options.download !== false ? { flags: "attachment" } : {}),
  });
}

export { cloudinary };
