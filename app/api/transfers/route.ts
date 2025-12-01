import { NextResponse } from "next/server";
import { Prisma, CategoryType, TransactionType } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/finance";
import { getOrCreateCategory } from "@/lib/categories";

export const runtime = "nodejs";

const transferSchema = z.object({
  fromWalletId: z.string().cuid(),
  toWalletId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  fee: z.coerce.number().min(0).optional(),
  date: z.coerce.date().optional(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = transferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const { fromWalletId, toWalletId, amount, fee = 0, date, note } = parsed.data;

    if (fromWalletId === toWalletId) {
      return NextResponse.json(
        { error: "Wallet asal dan tujuan tidak boleh sama" },
        { status: 400 }
      );
    }

    const [fromWallet, toWallet] = await Promise.all([
      prisma.wallet.findFirst({ where: { id: fromWalletId, userId } }),
      prisma.wallet.findFirst({ where: { id: toWalletId, userId } }),
    ]);

    if (!fromWallet || !toWallet) {
      return NextResponse.json(
        { error: "Wallet tidak ditemukan" },
        { status: 404 }
      );
    }

    const [transferOutCategory, transferInCategory, feeCategory] = await Promise.all([
      getOrCreateCategory(userId, "Transfer Keluar", CategoryType.EXPENSE),
      getOrCreateCategory(userId, "Transfer Masuk", CategoryType.INCOME),
      getOrCreateCategory(userId, "Biaya Admin", CategoryType.EXPENSE),
    ]);

    const amountDecimal = new Prisma.Decimal(amount);
    const feeDecimal = new Prisma.Decimal(fee);
    const txDate = date ?? new Date();

    const result = await prisma.$transaction(async (tx) => {
      const transferOut = await tx.transaction.create({
        data: {
          walletId: fromWalletId,
          categoryId: transferOutCategory.id,
          type: TransactionType.EXPENSE,
          amount: amountDecimal,
          date: txDate,
          note: note || `Transfer ke ${toWallet.name}`,
          userId,
        },
        include: { wallet: true, category: true },
      });

      await tx.wallet.update({
        where: { id: fromWalletId },
        data: { currentBalance: { decrement: amountDecimal.plus(feeDecimal) } },
      });

      const transferIn = await tx.transaction.create({
        data: {
          walletId: toWalletId,
          categoryId: transferInCategory.id,
          type: TransactionType.INCOME,
          amount: amountDecimal,
          date: txDate,
          note: note || `Transfer dari ${fromWallet.name}`,
          userId,
        },
        include: { wallet: true, category: true },
      });

      await tx.wallet.update({
        where: { id: toWalletId },
        data: { currentBalance: { increment: amountDecimal } },
      });

      let feeTx: typeof transferOut | null = null;
      if (!feeDecimal.isZero()) {
        feeTx = await tx.transaction.create({
          data: {
            walletId: fromWalletId,
            categoryId: feeCategory.id,
            type: TransactionType.EXPENSE,
            amount: feeDecimal,
            date: txDate,
            note: note ? `${note} (biaya)` : "Biaya admin transfer",
            userId,
          },
          include: { wallet: true, category: true },
        });
      }

      return { transferOut, transferIn, feeTx };
    });

    return NextResponse.json({
      transferOut: {
        ...result.transferOut,
        amount: decimalToNumber(result.transferOut.amount),
      },
      transferIn: {
        ...result.transferIn,
        amount: decimalToNumber(result.transferIn.amount),
      },
      feeTx: result.feeTx
        ? { ...result.feeTx, amount: decimalToNumber(result.feeTx.amount) }
        : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memproses transfer" }, { status: 500 });
  }
}
