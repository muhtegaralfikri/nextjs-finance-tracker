import { NextResponse } from "next/server";
import { Prisma, TransactionType } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/categories";
import { getMonthRange, decimalToNumber } from "@/lib/finance";

export const runtime = "nodejs";

const transactionSchema = z.object({
  walletId: z.string().cuid(),
  categoryId: z.string().cuid(),
  type: z.nativeEnum(TransactionType),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const walletId = searchParams.get("walletId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const fromParam = searchParams.get("from") || undefined;
  const toParam = searchParams.get("to") || undefined;

  try {
    const { from, to } = fromParam || toParam ? getRangeWithCustomDates(fromParam, toParam) : getMonthRange();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        walletId,
        categoryId,
        date: {
          gte: from,
          lte: to,
        },
      },
      include: {
        wallet: true,
        category: true,
      },
      orderBy: { date: "desc" },
    });

    const normalized = transactions.map((tx) => ({
      ...tx,
      amount: decimalToNumber(tx.amount),
    }));

    return NextResponse.json({ transactions: normalized });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil transaksi" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  await ensureDefaultCategories(userId);

  try {
    const json = await request.json();
    const parsed = transactionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { walletId, categoryId, type, amount, date, note } = parsed.data;

    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!wallet || !category) {
      return NextResponse.json(
        { error: "Wallet atau kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    if (category.type !== type) {
      return NextResponse.json(
        { error: "Tipe transaksi tidak sesuai dengan tipe kategori" },
        { status: 400 }
      );
    }

    const decimalAmount = new Prisma.Decimal(amount);

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          walletId,
          categoryId,
          type,
          amount: decimalAmount,
          date,
          note,
          userId,
        },
        include: {
          wallet: true,
          category: true,
        },
      });

      const balanceChange =
        type === TransactionType.INCOME ? decimalAmount : decimalAmount.negated();

      await tx.wallet.update({
        where: { id: walletId },
        data: {
          currentBalance: {
            increment: balanceChange,
          },
        },
      });

      return created;
    });

    return NextResponse.json(
      { ...transaction, amount: decimalToNumber(transaction.amount) },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi" },
      { status: 500 }
    );
  }
}

function getRangeWithCustomDates(fromParam?: string, toParam?: string) {
  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;

  if (from && Number.isNaN(from.getTime())) {
    throw new Error("Invalid from date");
  }
  if (to && Number.isNaN(to.getTime())) {
    throw new Error("Invalid to date");
  }

  return {
    from: from || getMonthRange().from,
    to: to || getMonthRange().to,
  };
}
