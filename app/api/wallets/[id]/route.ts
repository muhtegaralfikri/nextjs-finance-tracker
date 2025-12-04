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
  const userId = session.user.id;

  const { id } = await params;

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId },
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

    // Validasi: perubahan initialBalance tidak boleh menyebabkan saldo negatif
    if (deltaInitial && !deltaInitial.isZero()) {
      const projectedBalance = Number(wallet.currentBalance) + Number(deltaInitial);
      if (projectedBalance < 0) {
        return NextResponse.json(
          { 
            error: `Perubahan saldo awal akan menyebabkan saldo negatif. Saldo saat ini: Rp${Number(wallet.currentBalance).toLocaleString("id-ID")}` 
          },
          { status: 400 }
        );
      }
    }

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

    const walletsWithBalance = await getWalletsWithBalance(userId);
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
  const userId = session.user.id;

  const { id } = await params;

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: { walletId: wallet.id, userId },
    });

    await tx.wallet.delete({ where: { id: wallet.id } });
  });
  return NextResponse.json({ success: true });
}
