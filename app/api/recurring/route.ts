import { NextResponse } from "next/server";
import { Prisma, RecurringCadence, TransactionType } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const recurringSchema = z.object({
  walletId: z.string().cuid(),
  categoryId: z.string().cuid(),
  type: z.nativeEnum(TransactionType),
  amount: z.coerce.number().positive(),
  cadence: z.nativeEnum(RecurringCadence),
  nextRun: z.coerce.date(),
  note: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recurrences = await prisma.recurringTransaction.findMany({
    where: { userId: session.user.id },
    include: {
      wallet: true,
      category: true,
    },
    orderBy: { nextRun: "asc" },
  });

  return NextResponse.json({
    recurrences: recurrences.map((r) => ({
      ...r,
      amount: Number(r.amount),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const json = await request.json();
    const parsed = recurringSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { walletId, categoryId, type, amount, cadence, nextRun, note } = parsed.data;

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

    const created = await prisma.recurringTransaction.create({
      data: {
        userId,
        walletId,
        categoryId,
        type,
        cadence,
        nextRun,
        note,
        amount: new Prisma.Decimal(amount),
      },
      include: {
        wallet: true,
        category: true,
      },
    });

    return NextResponse.json({
      ...created,
      amount: Number(created.amount),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi berulang" },
      { status: 500 }
    );
  }
}
