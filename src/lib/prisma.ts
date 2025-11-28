// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Force binary engine at runtime to avoid the Accelerate/adapter requirement.
process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["query", "error", "warn"], // bisa di-on kalau mau debug
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
