import { TransactionType } from "@prisma/client";
import { prisma } from "./prisma";
import { decimalToNumber, getMonthRange } from "./finance";

export async function getBudgetsWithProgress(userId: string, monthParam?: string) {
  const { from, to, label } = getMonthRange(monthParam);

  const budgets = await prisma.budget.findMany({
    where: { userId, month: label },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  const expenseSums = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: TransactionType.EXPENSE,
      date: { gte: from, lte: to },
    },
    _sum: { amount: true },
  });

  const spentMap = new Map<string, number>();
  for (const row of expenseSums) {
    spentMap.set(row.categoryId, decimalToNumber(row._sum.amount));
  }

  return budgets.map((budget) => {
    const spent = spentMap.get(budget.categoryId) || 0;
    const amount = decimalToNumber(budget.amount);
    const remaining = Math.max(amount - spent, 0);
    const progress =
      amount === 0 ? 0 : Math.min(100, Math.round((spent / amount) * 100));

    return {
      ...budget,
      amount,
      spent,
      remaining,
      progress,
      month: label,
    };
  });
}
