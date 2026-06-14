import { prisma } from "@/lib/prisma";

export interface LocationsData {
  country: string;
  states: { state: string; cities: string[] }[];
}

export interface HomepageData {
  heroTitle: string;
  heroSubtitle: string;
  featuredCount: number;
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return (row?.value as T) ?? null;
}

export async function setSetting(key: string, value: unknown) {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { value: value as object },
    create: { key, value: value as object },
  });
}

export async function getLocations(): Promise<LocationsData> {
  return (
    (await getSetting<LocationsData>("locations")) ?? { country: "India", states: [] }
  );
}

export async function getHomepage(): Promise<HomepageData> {
  return (
    (await getSetting<HomepageData>("homepage")) ?? {
      heroTitle: "Find Your Next Pharmacy & Medical Career",
      heroSubtitle:
        "Government and private pharmacist, medical representative, and healthcare jobs across India.",
      featuredCount: 6,
    }
  );
}
