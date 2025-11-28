-- AlterTable for PostgreSQL
ALTER TABLE "Wallet" ADD COLUMN "currentBalance" NUMERIC(65, 30) NOT NULL DEFAULT 0;
