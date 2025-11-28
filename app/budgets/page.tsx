import { redirect } from "next/navigation";
import { CategoryType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMonthRange } from "@/lib/finance";
import { getBudgetsWithProgress } from "@/lib/budgets";
import { getGoalsWithProgress } from "@/lib/goals";
import { ensureDefaultCategories } from "@/lib/categories";
import BudgetsClient, { BudgetCategory, BudgetItem } from "./BudgetsClient";
import GoalsClient, { GoalItem } from "./GoalsClient";
import AppShell from "@/components/AppShell";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { label } = getMonthRange();

  await ensureDefaultCategories(userId);

  const budgetsRaw = await getBudgetsWithProgress(userId, label);
  const budgets: BudgetItem[] = budgetsRaw.map((budget) => ({
    id: budget.id,
    categoryId: budget.categoryId,
    categoryName: budget.category?.name ?? "Kategori",
    month: budget.month,
    amount: Number(budget.amount),
    spent: budget.spent,
    remaining: budget.remaining,
    progress: budget.progress,
  }));

  const categories: BudgetCategory[] = await prisma.category
    .findMany({
      where: { userId, type: CategoryType.EXPENSE },
      orderBy: { name: "asc" },
    })
    .then((rows) => rows.map((row) => ({ id: row.id, name: row.name })));

  const goalsRaw = await getGoalsWithProgress(userId);
  const goals: GoalItem[] = goalsRaw.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    progress: goal.progress,
    deadline: goal.deadline ? goal.deadline.toISOString() : null,
    note: goal.note || null,
  }));

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Budgets & Savings Goals</h1>
          <p className="text-slate-400 text-sm mt-1">
            Tetapkan batas pengeluaran per kategori dan target tabungan yang ingin dicapai dengan UX lebih responsif.
          </p>
        </div>

        <BudgetsClient initialBudgets={budgets} categories={categories} initialMonth={label} />

        <GoalsClient initialGoals={goals} />
      </div>
    </AppShell>
  );
}
