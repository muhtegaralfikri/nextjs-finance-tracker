import { NextResponse } from "next/server";
import { WalletType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, getWalletsWithBalance } from "@/lib/finance";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallets = (await getWalletsWithBalance(session.user.id)).map((wallet) => ({
    ...wallet,
    initialBalance: decimalToNumber(wallet.initialBalance),
    balance: decimalToNumber(wallet.balance),
  }));

  return NextResponse.json({ wallets });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, initialBalance, currency } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name dan type wajib diisi" },
        { status: 400 }
      );
    }

    if (!Object.values(WalletType).includes(type)) {
      return NextResponse.json(
        { error: "Jenis wallet tidak valid" },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.create({
      data: {
        name,
        type,
        currency: currency || "IDR",
        initialBalance: Number(initialBalance) || 0,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        ...wallet,
        initialBalance: decimalToNumber(wallet.initialBalance),
        balance: Number(initialBalance) || 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal membuat wallet" },
      { status: 500 }
    );
  }
}
