import { NextResponse } from "next/server";
import { Prisma, TransactionType } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/finance";

export const runtime = "nodejs";

const transactionUpdateSchema = z.object({
  walletId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  amount: z.coerce.number().positive().optional(),
  date: z.coerce.date().optional(),
  note: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = transactionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { walletId, categoryId, type, amount, date, note } = parsed.data;

    if (walletId) {
      const wallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId: session.user.id },
      });
      if (!wallet) {
        return NextResponse.json(
          { error: "Wallet tidak ditemukan" },
          { status: 404 }
        );
      }
    }

    const parsedDate = date ?? transaction.date;

    const targetType = (type ?? transaction.type) as TransactionType;
    let targetCategoryId = transaction.categoryId;
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: session.user.id },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Kategori tidak ditemukan" },
          { status: 404 }
        );
      }
      if (category.type !== targetType) {
        return NextResponse.json(
          { error: "Tipe transaksi tidak sesuai dengan tipe kategori" },
          { status: 400 }
        );
      }
      targetCategoryId = category.id;
    } else {
      const category = await prisma.category.findFirst({
        where: { id: transaction.categoryId, userId: session.user.id },
      });
      if (category && category.type !== targetType) {
        return NextResponse.json(
          { error: "Tipe transaksi tidak sesuai dengan tipe kategori" },
          { status: 400 }
        );
      }
    }

    const nextAmountDecimal =
      amount !== undefined ? new Prisma.Decimal(amount) : new Prisma.Decimal(transaction.amount);
    const nextWalletId = walletId ?? transaction.walletId;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          walletId: nextWalletId,
          categoryId: targetCategoryId,
          type: targetType,
          amount: nextAmountDecimal,
          date: parsedDate,
          note: note ?? transaction.note,
        },
        include: { wallet: true, category: true },
      });

      const previousChange =
        transaction.type === TransactionType.INCOME
          ? new Prisma.Decimal(transaction.amount)
          : new Prisma.Decimal(transaction.amount).negated();
      const nextChange =
        targetType === TransactionType.INCOME
          ? nextAmountDecimal
          : nextAmountDecimal.negated();

      if (transaction.walletId === nextWalletId) {
        const delta = nextChange.minus(previousChange);
        if (!delta.isZero()) {
          await tx.wallet.update({
            where: { id: nextWalletId },
            data: { currentBalance: { increment: delta } },
          });
        }
      } else {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { currentBalance: { increment: previousChange.negated() } },
        });
        await tx.wallet.update({
          where: { id: nextWalletId },
          data: { currentBalance: { increment: nextChange } },
        });
      }

      return result;
    });

    return NextResponse.json({
      ...updated,
      amount: decimalToNumber(updated.amount),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal memperbarui transaksi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    const reverseChange =
      transaction.type === TransactionType.INCOME
        ? new Prisma.Decimal(transaction.amount).negated()
        : new Prisma.Decimal(transaction.amount);

    await tx.wallet.update({
      where: { id: transaction.walletId },
      data: { currentBalance: { increment: reverseChange } },
    });

    await tx.transaction.delete({ where: { id: transaction.id } });
  });

  return NextResponse.json({ success: true });
}
