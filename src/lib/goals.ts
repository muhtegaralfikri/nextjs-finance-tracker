import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { decimalToNumber } from "./finance";

export type GoalWithProgress = Awaited<ReturnType<typeof getGoalsWithProgress>>[number];

export async function getGoalsWithProgress(userId: string) {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return goals.map(serializeGoal);
}

type GoalAmountLike = {
  targetAmount: Prisma.Decimal | number | null | undefined;
  currentAmount: Prisma.Decimal | number | null | undefined;
};

export function serializeGoal<T extends GoalAmountLike>(goal: T) {
  const target = decimalToNumber(goal.targetAmount);
  const current = decimalToNumber(goal.currentAmount);
  const progress = target === 0 ? 0 : Math.min(100, Math.round((current / target) * 100));

  return {
    ...goal,
    targetAmount: target,
    currentAmount: current,
    progress,
  };
}
