import { NextResponse } from "next/server";
import { CategoryType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBudgetsWithProgress } from "@/lib/budgets";
import { getMonthRange } from "@/lib/finance";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const budget = await prisma.budget.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!budget) {
    return NextResponse.json({ error: "Budget tidak ditemukan" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { categoryId, month, amount } = body;

    const parsedAmount =
      amount !== undefined ? Number(amount) : undefined;
    if (parsedAmount !== undefined && (Number.isNaN(parsedAmount) || parsedAmount < 0)) {
      return NextResponse.json(
        { error: "Amount harus berupa angka positif" },
        { status: 400 }
      );
    }

    let targetMonth = budget.month;
    if (month) {
      const { label } = getMonthRange(month);
      targetMonth = label;
    } else {
      // Normalize stored month to consistent label
      targetMonth = getMonthRange(budget.month).label;
    }

    let targetCategoryId = budget.categoryId;
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
      if (category.type !== CategoryType.EXPENSE) {
        return NextResponse.json(
          { error: "Budget hanya untuk kategori EXPENSE" },
          { status: 400 }
        );
      }
      targetCategoryId = category.id;
    }

    const duplicate = await prisma.budget.findFirst({
      where: {
        userId: session.user.id,
        categoryId: targetCategoryId,
        month: targetMonth,
        NOT: { id: budget.id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Budget untuk kategori dan bulan ini sudah ada" },
        { status: 400 }
      );
    }

    const updated = await prisma.budget.update({
      where: { id: budget.id },
      data: {
        categoryId: targetCategoryId,
        month: targetMonth,
        amount: parsedAmount ?? budget.amount,
      },
      include: { category: true },
    });

    const budgets = await getBudgetsWithProgress(session.user.id, targetMonth);
    const response = budgets.find((b) => b.id === updated.id) ?? updated;

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal memperbarui budget" },
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

  const budget = await prisma.budget.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!budget) {
    return NextResponse.json({ error: "Budget tidak ditemukan" }, { status: 404 });
  }

  await prisma.budget.delete({ where: { id: budget.id } });
  return NextResponse.json({ success: true });
}
