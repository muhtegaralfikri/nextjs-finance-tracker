import { Prisma, TransactionType } from "@prisma/client";
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

  const txSums = await prisma.transaction.groupBy({
    by: ["walletId", "type"],
    where: { userId },
    _sum: { amount: true },
  });

  const balanceByWallet = new Map<string, Prisma.Decimal>();

  txSums.forEach(({ walletId, type, _sum }) => {
    const existing = balanceByWallet.get(walletId) ?? new Prisma.Decimal(0);
    const amount = _sum.amount ?? new Prisma.Decimal(0);
    const signed =
      type === TransactionType.INCOME ? amount : amount.negated();
    balanceByWallet.set(walletId, existing.plus(signed));
  });

  return wallets.map((wallet) => {
    const txTotal = balanceByWallet.get(wallet.id) ?? new Prisma.Decimal(0);
    const balanceDecimal = wallet.initialBalance.plus(txTotal);
    return { ...wallet, balance: balanceDecimal };
  });
}
