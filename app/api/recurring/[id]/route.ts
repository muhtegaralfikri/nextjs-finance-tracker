import { NextResponse } from "next/server";
import { Prisma, RecurringCadence, TransactionType } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const recurringUpdateSchema = z.object({
  walletId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  amount: z.coerce.number().positive().optional(),
  cadence: z.nativeEnum(RecurringCadence).optional(),
  nextRun: z.coerce.date().optional(),
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
  const userId = session.user.id;
  const { id } = await params;

  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id, userId },
  });

  if (!recurring) {
    return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = recurringUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { walletId, categoryId, type, amount, cadence, nextRun, note } = parsed.data;

    // Validasi wallet jika diubah
    if (walletId) {
      const wallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId },
      });
      if (!wallet) {
        return NextResponse.json(
          { error: "Wallet tidak ditemukan" },
          { status: 404 }
        );
      }
    }

    // Validasi category jika diubah
    const targetType = type ?? recurring.type;
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
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
    } else if (type) {
      // Jika type diubah tapi category tidak, cek apakah category lama cocok
      const category = await prisma.category.findFirst({
        where: { id: recurring.categoryId, userId },
      });
      if (category && category.type !== type) {
        return NextResponse.json(
          { error: "Tipe transaksi tidak sesuai dengan tipe kategori saat ini" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        walletId: walletId ?? recurring.walletId,
        categoryId: categoryId ?? recurring.categoryId,
        type: targetType,
        amount: amount !== undefined ? new Prisma.Decimal(amount) : recurring.amount,
        cadence: cadence ?? recurring.cadence,
        nextRun: nextRun ?? recurring.nextRun,
        note: note !== undefined ? note : recurring.note,
      },
      include: {
        wallet: true,
        category: true,
      },
    });

    return NextResponse.json({
      ...updated,
      amount: Number(updated.amount),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal memperbarui transaksi berulang" },
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
  const userId = session.user.id;
  const { id } = await params;

  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id, userId },
  });

  if (!recurring) {
    return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
  }

  await prisma.recurringTransaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
