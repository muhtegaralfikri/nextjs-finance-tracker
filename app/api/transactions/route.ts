import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/categories";
import { getMonthRange, decimalToNumber } from "@/lib/finance";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const walletId = searchParams.get("walletId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const fromParam = searchParams.get("from") || undefined;
  const toParam = searchParams.get("to") || undefined;

  try {
    const { from, to } = fromParam || toParam ? getRangeWithCustomDates(fromParam, toParam) : getMonthRange();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
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

  await ensureDefaultCategories(session.user.id);

  try {
    const body = await request.json();
    const { walletId, categoryId, type, amount, date, note } = body;

    if (!walletId || !categoryId || !type || !amount || !date) {
      return NextResponse.json(
        { error: "walletId, categoryId, type, amount, dan date wajib diisi" },
        { status: 400 }
      );
    }

    if (!Object.values(TransactionType).includes(type)) {
      return NextResponse.json(
        { error: "Jenis transaksi tidak valid" },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId: session.user.id },
    });
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: session.user.id },
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

    const transactionDate = new Date(date);
    if (Number.isNaN(transactionDate.getTime())) {
      return NextResponse.json(
        { error: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        walletId,
        categoryId,
        type,
        amount: Number(amount),
        date: transactionDate,
        note,
        userId: session.user.id,
      },
      include: {
        wallet: true,
        category: true,
      },
    });

    return NextResponse.json(
      { ...transaction, amount: Number(transaction.amount) },
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
