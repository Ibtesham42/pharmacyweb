import { AdSlot } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdInput } from "@/lib/validation";

const blank = (v?: string | null) => (v && v.length ? v : undefined);

/** Active ad for a slot (respects start/end dates). Returns null if none. */
export async function getAdForSlot(slot: AdSlot) {
  const now = new Date();
  return prisma.advertisement.findFirst({
    where: {
      slot,
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAds() {
  return prisma.advertisement.findMany({ orderBy: { slot: "asc" } });
}

export async function createAd(input: AdInput) {
  return prisma.advertisement.create({
    data: {
      name: input.name,
      slot: input.slot,
      type: input.type,
      adsenseSlotId: blank(input.adsenseSlotId),
      imageUrl: blank(input.imageUrl),
      targetUrl: blank(input.targetUrl),
      htmlSnippet: blank(input.htmlSnippet),
      isActive: input.isActive,
    },
  });
}

export async function updateAd(id: string, input: AdInput) {
  return prisma.advertisement.update({
    where: { id },
    data: {
      name: input.name,
      slot: input.slot,
      type: input.type,
      adsenseSlotId: blank(input.adsenseSlotId) ?? null,
      imageUrl: blank(input.imageUrl) ?? null,
      targetUrl: blank(input.targetUrl) ?? null,
      htmlSnippet: blank(input.htmlSnippet) ?? null,
      isActive: input.isActive,
    },
  });
}

export async function deleteAd(id: string) {
  return prisma.advertisement.delete({ where: { id } });
}

export async function trackImpression(id: string) {
  await prisma.advertisement.update({ where: { id }, data: { impressions: { increment: 1 } } }).catch(() => {});
}

export async function trackClick(id: string) {
  await prisma.advertisement.update({ where: { id }, data: { clicks: { increment: 1 } } }).catch(() => {});
}
