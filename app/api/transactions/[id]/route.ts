import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/finance";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { walletId, categoryId, type, amount, date, note } = body;

    if (type && !Object.values(TransactionType).includes(type)) {
      return NextResponse.json(
        { error: "Jenis transaksi tidak valid" },
        { status: 400 }
      );
    }

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

    const parsedDate = date ? new Date(date) : transaction.date;
    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }

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

    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        walletId: walletId ?? transaction.walletId,
        categoryId: targetCategoryId,
        type: targetType,
        amount:
          amount !== undefined ? Number(amount) : decimalToNumber(transaction.amount),
        date: parsedDate,
        note: note ?? transaction.note,
      },
      include: { wallet: true, category: true },
    });

    return NextResponse.json({ ...updated, amount: Number(updated.amount) });
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
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id: transaction.id } });
  return NextResponse.json({ success: true });
}
