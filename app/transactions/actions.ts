"use server";

import { Prisma, TransactionType } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ensureDefaultCategories } from "@/lib/categories";
import { decimalToNumber } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

const transactionSchema = z.object({
  walletId: z.string().cuid(),
  categoryId: z.string().cuid(),
  type: z.nativeEnum(TransactionType),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  note: z.string().optional(),
});

export async function createTransactionAction(input: {
  walletId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const userId = session.user.id;

  await ensureDefaultCategories(userId);

  const parsed = transactionSchema.parse(input);

  const wallet = await prisma.wallet.findFirst({
    where: { id: parsed.walletId, userId },
  });
  const category = await prisma.category.findFirst({
    where: { id: parsed.categoryId, userId },
  });

  if (!wallet || !category) {
    throw new Error("Wallet atau kategori tidak ditemukan");
  }

  if (category.type !== parsed.type) {
    throw new Error("Tipe transaksi tidak sesuai dengan tipe kategori");
  }

  const decimalAmount = new Prisma.Decimal(parsed.amount);

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        walletId: parsed.walletId,
        categoryId: parsed.categoryId,
        type: parsed.type,
        amount: decimalAmount,
        date: parsed.date,
        note: parsed.note,
        userId,
      },
      include: {
        wallet: true,
        category: true,
      },
    });

    const balanceChange =
      parsed.type === TransactionType.INCOME
        ? decimalAmount
        : decimalAmount.negated();

    await tx.wallet.update({
      where: { id: parsed.walletId },
      data: {
        currentBalance: {
          increment: balanceChange,
        },
      },
    });

    return created;
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");

  return {
    id: transaction.id,
    walletId: transaction.walletId,
    walletName: transaction.wallet.name,
    categoryId: transaction.categoryId,
    categoryName: transaction.category.name,
    categoryType: transaction.category.type,
    type: transaction.type,
    amount: decimalToNumber(transaction.amount),
    date: transaction.date.toISOString(),
    note: transaction.note || undefined,
  };
}
