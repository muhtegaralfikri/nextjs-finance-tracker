import { NextResponse } from "next/server";
import { Prisma, WalletType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, getWalletsWithBalance } from "@/lib/finance";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, type, currency, initialBalance } = body;

    if (type && !Object.values(WalletType).includes(type)) {
      return NextResponse.json(
        { error: "Jenis wallet tidak valid" },
        { status: 400 }
      );
    }

    const parsedInitial =
      initialBalance !== undefined
        ? new Prisma.Decimal(initialBalance)
        : undefined;

    const deltaInitial =
      parsedInitial !== undefined
        ? parsedInitial.minus(wallet.initialBalance)
        : undefined;

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        name: name ?? wallet.name,
        type: type ?? wallet.type,
        currency: currency ?? wallet.currency,
        initialBalance: parsedInitial ?? wallet.initialBalance,
        ...(deltaInitial && !deltaInitial.isZero()
          ? { currentBalance: { increment: deltaInitial } }
          : {}),
      },
    });

    const walletsWithBalance = await getWalletsWithBalance(session.user.id);
    const target = walletsWithBalance.find((w) => w.id === updated.id);

    return NextResponse.json(
      target
        ? {
            ...target,
            initialBalance: decimalToNumber(target.initialBalance),
            balance: decimalToNumber(target.balance),
          }
        : {
            ...updated,
            initialBalance: decimalToNumber(updated.initialBalance),
            balance: decimalToNumber(updated.initialBalance),
          }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui wallet" }, { status: 500 });
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

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });
  }

  const hasTransactions = await prisma.transaction.count({
    where: { walletId: wallet.id, userId: session.user.id },
  });

  if (hasTransactions > 0) {
    return NextResponse.json(
      { error: "Wallet memiliki transaksi, tidak bisa dihapus" },
      { status: 400 }
    );
  }

  await prisma.wallet.delete({ where: { id: wallet.id } });
  return NextResponse.json({ success: true });
}
