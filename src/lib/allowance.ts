import { TransactionType } from "@prisma/client";
import { prisma } from "./prisma";
import { decimalToNumber, getMonthRange } from "./finance";

export type DailyExpense = {
  date: string;
  spent: number;
};

export function getDaysInMonth(label: string) {
  const [yearStr, monthStr] = label.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!year || Number.isNaN(month) || month < 1 || month > 12) {
    throw new Error("Invalid month label, expected YYYY-MM");
  }

  return new Date(year, month, 0).getDate();
}

export async function getDailyExpensesByDate(
  userId: string,
  options?: { month?: string; categoryId?: string; walletId?: string }
) {
  const { from, to, label } = getMonthRange(options?.month);

  const where = {
    userId,
    type: TransactionType.EXPENSE,
    date: { gte: from, lte: to },
    ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
    ...(options?.walletId ? { walletId: options.walletId } : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    select: { amount: true, date: true },
  });

  const dailyTotals = new Map<string, number>();

  transactions.forEach((tx) => {
    const key = tx.date.toISOString().split("T")[0];
    const current = dailyTotals.get(key) ?? 0;
    dailyTotals.set(key, current + decimalToNumber(tx.amount));
  });

  const daysInMonth = getDaysInMonth(label);
  const days: DailyExpense[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${label}-${String(day).padStart(2, "0")}`;
    days.push({ date, spent: dailyTotals.get(date) ?? 0 });
  }

  return { month: label, days };
}
