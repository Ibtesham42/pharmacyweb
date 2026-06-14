import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient — avoids exhausting connections during dev HMR and
// keeps a single pooled client in serverless (Vercel) runtimes.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
