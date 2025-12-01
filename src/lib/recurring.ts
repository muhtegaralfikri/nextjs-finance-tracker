import "server-only";
import { Prisma, RecurringCadence, TransactionType } from "@prisma/client";
import { prisma } from "./prisma";

function nextDate(current: Date, cadence: RecurringCadence) {
  const base = new Date(current);
  if (cadence === RecurringCadence.DAILY) {
    base.setDate(base.getDate() + 1);
  } else if (cadence === RecurringCadence.WEEKLY) {
    base.setDate(base.getDate() + 7);
  } else {
    // MONTHLY
    base.setMonth(base.getMonth() + 1);
  }
  return base;
}

export async function applyDueRecurrences(userId: string) {
  const now = new Date();
  const due = await prisma.recurringTransaction.findMany({
    where: { userId, nextRun: { lte: now } },
    include: { wallet: true, category: true },
  });

  if (due.length === 0) return { created: 0 };

  let createdCount = 0;
  await prisma.$transaction(async (tx) => {
    for (const rule of due) {
      if (!rule.wallet || !rule.category) {
        continue;
      }
      await tx.transaction.create({
        data: {
          userId,
          walletId: rule.walletId,
          categoryId: rule.categoryId,
          type: rule.type,
          amount: rule.amount,
          date: rule.nextRun,
          note: rule.note ?? null,
        },
      });

      const delta =
        rule.type === TransactionType.INCOME
          ? rule.amount
          : (rule.amount as Prisma.Decimal).negated();

      await tx.wallet.update({
        where: { id: rule.walletId },
        data: { currentBalance: { increment: delta } },
      });

      await tx.recurringTransaction.update({
        where: { id: rule.id },
        data: { nextRun: nextDate(rule.nextRun, rule.cadence) },
      });

      // Count successful creation
      createdCount += 1;
    }
  });

  return { created: createdCount };
}
