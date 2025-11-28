import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (!value) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

export function getMonthRange(monthParam?: string) {
  const now = new Date();
  if (!monthParam) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    return { from: start, to: end, label };
  }

  const [yearStr, monthStr] = monthParam.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1; // zero-based for Date()

  if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    throw new Error("Invalid month format, use YYYY-MM");
  }

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const label = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  return { from: start, to: end, label };
}

export async function getWalletsWithBalance(userId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return wallets.map((wallet) => {
    const balanceDecimal =
      wallet.currentBalance ??
      wallet.initialBalance ??
      new Prisma.Decimal(0);
    return { ...wallet, balance: balanceDecimal };
  });
}
