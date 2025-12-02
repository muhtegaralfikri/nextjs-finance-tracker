import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "./prisma";
import { decimalToNumber, getMonthRange, getWalletsWithBalance } from "./finance";

export async function getMonthlySummary(userId: string, monthParam?: string) {
  const { from, to, label } = getMonthRange(monthParam);

  // Ambil transaksi bulanan lengkap dengan currency wallet untuk agregasi per mata uang.
  const monthlyTransactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: from, lte: to } },
    select: {
      type: true,
      amount: true,
      categoryId: true,
      wallet: { select: { currency: true } },
    },
  });

  const incomeByCurrency = new Map<string, Prisma.Decimal>();
  const expenseByCurrency = new Map<string, Prisma.Decimal>();
  const expenseByCategoryByCurrency = new Map<
    string,
    Map<string, Prisma.Decimal>
  >();

  monthlyTransactions.forEach((tx) => {
    const currency = tx.wallet?.currency || "IDR";
    const amount = tx.amount ?? new Prisma.Decimal(0);

    if (tx.type === TransactionType.INCOME) {
      incomeByCurrency.set(
        currency,
        (incomeByCurrency.get(currency) ?? new Prisma.Decimal(0)).plus(amount)
      );
    } else if (tx.type === TransactionType.EXPENSE) {
      expenseByCurrency.set(
        currency,
        (expenseByCurrency.get(currency) ?? new Prisma.Decimal(0)).plus(amount)
      );
      if (tx.categoryId) {
        const existing = expenseByCategoryByCurrency.get(currency) ?? new Map<string, Prisma.Decimal>();
        existing.set(
          tx.categoryId,
          (existing.get(tx.categoryId) ?? new Prisma.Decimal(0)).plus(amount)
        );
        expenseByCategoryByCurrency.set(currency, existing);
      }
    }
  });

  const categoryIds = Array.from(
    new Set(
      monthlyTransactions
        .map((item) => item.categoryId)
        .filter(Boolean) as string[]
    )
  );
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryLookup = new Map(categories.map((c) => [c.id, c.name]));

  const byCategoryByCurrency: Record<
    string,
    { categoryId: string; categoryName: string; total: number }[]
  > = {};

  expenseByCategoryByCurrency.forEach((categoryMap, currency) => {
    byCategoryByCurrency[currency] = Array.from(categoryMap.entries()).map(
      ([categoryId, total]) => ({
        categoryId,
        categoryName: categoryLookup.get(categoryId) || "Kategori",
        total: decimalToNumber(total),
      })
    );
  });

  const wallets = await getWalletsWithBalance(userId);
  const balanceByCurrency = new Map<string, Prisma.Decimal>();
  const normalizedWallets = wallets.map((wallet) => {
    const balanceDecimal = wallet.balance ?? new Prisma.Decimal(0);
    balanceByCurrency.set(
      wallet.currency,
      (balanceByCurrency.get(wallet.currency) ?? new Prisma.Decimal(0)).plus(
        balanceDecimal
      )
    );
    return {
      ...wallet,
      initialBalance: decimalToNumber(wallet.initialBalance),
      balance: decimalToNumber(balanceDecimal),
    };
  });

  const totalBalanceByCurrency = Array.from(balanceByCurrency.entries()).map(
    ([currency, total]) => ({
      currency,
      total: decimalToNumber(total),
    })
  );

  const currencies = Array.from(
    new Set([
      ...incomeByCurrency.keys(),
      ...expenseByCurrency.keys(),
      ...balanceByCurrency.keys(),
    ])
  );

  const totalsByCurrency = currencies.map((currency) => {
    const income = decimalToNumber(incomeByCurrency.get(currency));
    const expense = decimalToNumber(expenseByCurrency.get(currency));
    return {
      currency,
      income,
      expense,
      net: income - expense,
    };
  });

  const primaryCurrency = currencies[0] || "IDR";
  const primaryTotals = totalsByCurrency.find(
    (item) => item.currency === primaryCurrency
  );
  const primaryBalance = totalBalanceByCurrency.find(
    (item) => item.currency === primaryCurrency
  );

  return {
    month: label,
    totalsByCurrency,
    totalBalanceByCurrency,
    primaryCurrency,
    totalIncome: primaryTotals?.income ?? 0,
    totalExpense: primaryTotals?.expense ?? 0,
    net: primaryTotals?.net ?? 0,
    byCategory: byCategoryByCurrency[primaryCurrency] || [],
    byCategoryByCurrency,
    totalBalance: primaryBalance?.total ?? 0,
    wallets: normalizedWallets,
  };
}
