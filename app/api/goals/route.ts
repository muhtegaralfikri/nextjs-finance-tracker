import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getGoalsWithProgress, serializeGoal } from "@/lib/goals";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await getGoalsWithProgress(session.user.id);
  return NextResponse.json({ goals });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, targetAmount, currentAmount, deadline, note } = body;

    if (!name || targetAmount === undefined) {
      return NextResponse.json(
        { error: "name dan targetAmount wajib diisi" },
        { status: 400 }
      );
    }

    const parsedTarget = Number(targetAmount);
    const parsedCurrent =
      currentAmount !== undefined ? Number(currentAmount) : 0;

    if (Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      return NextResponse.json(
        { error: "targetAmount harus lebih besar dari 0" },
        { status: 400 }
      );
    }

    if (Number.isNaN(parsedCurrent) || parsedCurrent < 0) {
      return NextResponse.json(
        { error: "currentAmount tidak valid" },
        { status: 400 }
      );
    }

    if (parsedCurrent > parsedTarget) {
      return NextResponse.json(
        { error: "currentAmount tidak boleh melebihi targetAmount" },
        { status: 400 }
      );
    }

    let parsedDeadline: Date | undefined;
    if (deadline) {
      const dateObj = new Date(deadline);
      if (Number.isNaN(dateObj.getTime())) {
        return NextResponse.json(
          { error: "Format deadline tidak valid" },
          { status: 400 }
        );
      }
      parsedDeadline = dateObj;
    }

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        name,
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline: parsedDeadline,
        note: note || null,
      },
    });

    return NextResponse.json(serializeGoal(goal), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal membuat goal" },
      { status: 500 }
    );
  }
}
