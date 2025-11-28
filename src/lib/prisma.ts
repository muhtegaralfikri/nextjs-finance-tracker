// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Ambil konfigurasi dari DATABASE_URL
const connectionString = process.env.DATABASE_URL || "mysql://finance_user:W32tdDDLXxKytm7S@localhost:3307/finance_db";

// Parse connection string untuk mendapatkan konfigurasi
const url = new URL(connectionString);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1), // Remove leading slash
  // Konfigurasi tambahan untuk mariadb
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

// Prisma adapter will handle pooling internally from the config
const adapter = new PrismaMariaDb(config);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
