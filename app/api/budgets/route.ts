import { NextResponse } from "next/server";
import { CategoryType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBudgetsWithProgress } from "@/lib/budgets";
import { getMonthRange } from "@/lib/finance";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month") || undefined;

  try {
    const { label } = getMonthRange(monthParam);
    const budgets = await getBudgetsWithProgress(session.user.id, label);
    return NextResponse.json({ month: label, budgets });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil budget" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { categoryId, month, amount } = body;

    if (!categoryId || month === undefined || amount === undefined) {
      return NextResponse.json(
        { error: "categoryId, month, dan amount wajib diisi" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount harus lebih besar dari 0" },
        { status: 400 }
      );
    }

    const { label } = getMonthRange(month);

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: session.user.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    if (category.type !== CategoryType.EXPENSE) {
      return NextResponse.json(
        { error: "Budget hanya bisa dibuat untuk kategori EXPENSE" },
        { status: 400 }
      );
    }

    const existing = await prisma.budget.findFirst({
      where: { userId: session.user.id, categoryId, month: label },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Budget untuk kategori dan bulan ini sudah ada" },
        { status: 400 }
      );
    }

    const created = await prisma.budget.create({
      data: {
        userId: session.user.id,
        categoryId,
        month: label,
        amount: parsedAmount,
      },
      include: { category: true },
    });

    const budgets = await getBudgetsWithProgress(session.user.id, label);
    const response = budgets.find((b) => b.id === created.id) ?? {
      ...created,
      amount: parsedAmount,
      spent: 0,
      remaining: parsedAmount,
      progress: 0,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal membuat budget" },
      { status: 500 }
    );
  }
}
