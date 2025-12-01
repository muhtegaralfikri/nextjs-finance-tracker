import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/goals";

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

  const goal = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, targetAmount, currentAmount, deadline, note } = body;

    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (note !== undefined) updates.note = note ?? null;

    if (targetAmount !== undefined) {
      const parsed = Number(targetAmount);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: "targetAmount harus lebih besar dari 0" },
          { status: 400 }
        );
      }
      updates.targetAmount = parsed;
    }

    if (currentAmount !== undefined) {
      const parsed = Number(currentAmount);
      if (Number.isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: "currentAmount tidak valid" },
          { status: 400 }
        );
      }
      updates.currentAmount = parsed;
    }

    if (deadline !== undefined) {
      if (!deadline) {
        updates.deadline = null;
      } else {
        const parsedDate = new Date(deadline);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { error: "Format deadline tidak valid" },
            { status: 400 }
          );
        }
        updates.deadline = parsedDate;
      }
    }

    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: updates,
    });

    return NextResponse.json(serializeGoal(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal memperbarui goal" },
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

  const { id } = await params;

  const goal = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id: goal.id } });
  return NextResponse.json({ success: true });
}
