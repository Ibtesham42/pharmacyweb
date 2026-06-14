import { MediaType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteAsset } from "@/lib/cloudinary";

export interface MediaInput {
  type: MediaType;
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  uploadedById?: string;
}

export async function createMedia(input: MediaInput) {
  return prisma.media.create({
    data: {
      type: input.type,
      url: input.url,
      publicId: input.publicId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width,
      height: input.height,
      alt: input.alt,
      uploadedById: input.uploadedById,
    },
  });
}

export async function listMedia(opts: { type?: MediaType; page?: number } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 24;
  const where = opts.type ? { type: opts.type } : {};
  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.media.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function updateMediaAlt(id: string, alt: string) {
  return prisma.media.update({ where: { id }, data: { alt } });
}

export async function deleteMedia(id: string) {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return null;
  // Remove from Cloudinary (best-effort); raw resource type for PDFs/docs.
  const resourceType = media.type === MediaType.IMAGE ? "image" : "raw";
  await deleteAsset(media.publicId, resourceType).catch(() => {});
  return prisma.media.delete({ where: { id } });
}
