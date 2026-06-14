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

export { cloudinary };
