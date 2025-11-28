import { TransactionType } from "@prisma/client";
import { prisma } from "./prisma";
import { decimalToNumber, getMonthRange, getWalletsWithBalance } from "./finance";

export async function getMonthlySummary(userId: string, monthParam?: string) {
  const { from, to, label } = getMonthRange(monthParam);

  const totals = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      userId,
      date: { gte: from, lte: to },
    },
    _sum: { amount: true },
  });

  const totalIncome = totals.find((t) => t.type === TransactionType.INCOME)?._sum
    .amount;
  const totalExpense = totals.find((t) => t.type === TransactionType.EXPENSE)?._sum
    .amount;

  const expenseByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: TransactionType.EXPENSE,
      date: { gte: from, lte: to },
    },
    _sum: { amount: true },
  });

  const categoryIds = expenseByCategory.map((item) => item.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  const byCategory = expenseByCategory.map((item) => {
    const category = categories.find((c) => c.id === item.categoryId);
    return {
      categoryId: item.categoryId,
      categoryName: category?.name || "Kategori",
      total: decimalToNumber(item._sum.amount),
    };
  });

  const wallets = (await getWalletsWithBalance(userId)).map((wallet) => ({
    ...wallet,
    initialBalance: decimalToNumber(wallet.initialBalance),
    balance: decimalToNumber(wallet.balance),
  }));
  const totalBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);

  return {
    month: label,
    totalIncome: decimalToNumber(totalIncome),
    totalExpense: decimalToNumber(totalExpense),
    net: decimalToNumber(totalIncome) - decimalToNumber(totalExpense),
    byCategory,
    totalBalance,
    wallets,
  };
}
