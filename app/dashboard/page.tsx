import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/finance";
import { getMonthlySummary } from "@/lib/summary";
import { ensureDefaultCategories } from "@/lib/categories";
import { getBudgetsWithProgress } from "@/lib/budgets";
import { getGoalsWithProgress } from "@/lib/goals";
import AppShell from "@/components/AppShell";
import { WalletTypeLabels } from "@/lib/financeTypes";

export default async function DashboardPage() {
  const session = await auth();

  // Kalau belum login → ke /login
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const nameOrEmail = session.user.name || session.user.email || "User";

  // Pastikan kategori default ada, supaya transaksi pertama mudah
  await ensureDefaultCategories(userId);

  const summary = await getMonthlySummary(userId);
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    include: { wallet: true, category: true },
    orderBy: { date: "desc" },
    take: 5,
  });
  const budgets = await getBudgetsWithProgress(userId);
  const goals = await getGoalsWithProgress(userId);
  const trendFrom = new Date();
  trendFrom.setDate(trendFrom.getDate() - 13);
  const trendTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: trendFrom },
      wallet: { currency: summary.primaryCurrency },
    },
    select: { type: true, amount: true, date: true },
    orderBy: { date: "asc" },
  });
  const trend = buildTrendSeries(trendTransactions, trendFrom);

  const balancesMap = new Map(
    (summary.totalBalanceByCurrency || []).map((item) => [item.currency, item.total])
  );
  const statsByCurrency =
    summary.totalsByCurrency?.map((item) => ({
      ...item,
      balance: balancesMap.get(item.currency) ?? 0,
    })) || [];

  const monthLabel = formatMonthLabel(summary.month);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-1">
          <h1 className="text-3xl font-semibold text-white">
            Halo, <span className="text-slate-100">{nameOrEmail}</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Ringkasan bulan {monthLabel}. Pantau saldo, transaksi, dan pengeluaran.
          </p>
        </header>

        {/* --- STATS SECTION (PER CURRENCY) --- */}
        {statsByCurrency.length === 0 ? null : (
          <section className="space-y-4 mb-6">
            {statsByCurrency.map((stat) => (
              <div
                key={stat.currency}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <StatCard
                  title={`Total Saldo (${stat.currency})`}
                  value={formatCurrency(stat.balance, stat.currency)}
                  accent="from-emerald-500/80 to-emerald-400/60"
                />
                <StatCard
                  title={`Income Bulan Ini (${stat.currency})`}
                  value={formatCurrency(stat.income, stat.currency)}
                  accent="from-sky-500/80 to-sky-400/60"
                />
                <StatCard
                  title={`Expense Bulan Ini (${stat.currency})`}
                  value={formatCurrency(stat.expense, stat.currency)}
                  accent="from-rose-500/80 to-rose-400/60"
                />
                <StatCard
                  title={`Net (${stat.currency})`}
                  value={formatCurrency(stat.net, stat.currency)}
                  accent={stat.net >= 0 ? "from-emerald-500/80 to-emerald-400/60" : "from-amber-500/80 to-amber-400/60"}
                />
              </div>
            ))}
          </section>
        )}

        {/* --- TREN 14 HARI --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <SparklineCard title={`Income 14 hari (${summary.primaryCurrency})`} total={summary.totalIncome} series={trend.income} currency={summary.primaryCurrency} />
          <SparklineCard title={`Expense 14 hari (${summary.primaryCurrency})`} total={summary.totalExpense} series={trend.expense} currency={summary.primaryCurrency} variant="expense" />
        </section>

        {/* --- WALLETS & CATEGORIES SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Wallets</h2>
              <a
                href="/wallets"
                className="text-sm text-emerald-400 hover:text-emerald-300"
              >
                Kelola Wallet →
              </a>
            </div>
            <div className="space-y-2">
              {summary.wallets.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Belum ada wallet. Tambahkan wallet dulu untuk mulai mencatat transaksi.
                </p>
              ) : (
                summary.wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold">{wallet.name}</p>
                      <p className="text-xs text-slate-400">
                        {WalletTypeLabels[wallet.type] || wallet.type} • {wallet.currency}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-400">
                      {formatCurrency(decimalToNumber(wallet.balance), wallet.currency)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Expense per Kategori</h2>
              <span className="text-xs text-slate-500">
                Bulan {monthLabel} • {summary.primaryCurrency}
                {summary.totalsByCurrency?.length > 1 ? " (currency lain dilihat via transaksi)" : ""}
              </span>
            </div>
            <CategoryPie data={summary.byCategory} currency={summary.primaryCurrency} />
          </div>
        </section>

        {/* --- BUDGETS & GOALS SECTION --- */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Budgets Bulan {monthLabel}</h2>
              <a href="/budgets" className="text-sm text-emerald-400 hover:text-emerald-300">
                Kelola →
              </a>
            </div>
            {budgets.length === 0 ? (
              <p className="text-sm text-slate-400">
                Belum ada budget. Tambahkan budget per kategori expense.
              </p>
            ) : (
              <div className="space-y-3">
                {budgets.slice(0, 4).map((budget) => (
                  <div
                    key={budget.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">{budget.category?.name ?? "Kategori"}</p>
                      <span className="text-xs text-slate-400">{budget.month}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${budget.spent > budget.amount ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(budget.progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {formatCurrency(
                        decimalToNumber(budget.spent),
                        (budget as { currency?: string }).currency || "IDR"
                      )}{" "}
                      /{" "}
                      {formatCurrency(
                        decimalToNumber(budget.amount),
                        (budget as { currency?: string }).currency || "IDR"
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Savings Goals</h2>
              <a href="/budgets" className="text-sm text-emerald-400 hover:text-emerald-300">
                Kelola →
              </a>
            </div>
            {goals.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada goal.</p>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 4).map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">{goal.name}</p>
                      {goal.deadline && (
                        <span className="text-xs text-slate-400">
                          {formatDate(goal.deadline)}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {formatCurrency(
                        decimalToNumber(goal.currentAmount),
                        (goal as { currency?: string }).currency || "IDR"
                      )}{" "}
                      /{" "}
                      {formatCurrency(
                        decimalToNumber(goal.targetAmount),
                        (goal as { currency?: string }).currency || "IDR"
                      )}{" "}
                      ({goal.progress}%)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* --- TRANSACTIONS SECTION (UPDATED) --- */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
            <a
              href="/transactions"
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Lihat Semua →
            </a>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              Belum ada transaksi.
            </p>
          ) : (
            <>
              {/* 1. TAMPILAN DESKTOP (TABLE) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-800">
                      <th className="py-2 px-2">Tanggal</th>
                      <th className="py-2 px-2">Wallet</th>
                      <th className="py-2 px-2">Kategori</th>
                      <th className="py-2 px-2">Tipe</th>
                      <th className="py-2 px-2 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 px-2 text-slate-300">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-2 px-2">{tx.wallet.name}</td>
                        <td className="py-2 px-2">{tx.category.name}</td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              tx.type === "INCOME"
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-rose-500/10 text-rose-300"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">
                          <span
                            className={
                              tx.type === "INCOME" ? "text-emerald-300" : "text-rose-300"
                            }
                          >
                            {formatCurrency(decimalToNumber(tx.amount))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2. TAMPILAN MOBILE (STACKED LIST / CARD) */}
              <div className="sm:hidden space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {formatDate(tx.date)} • {tx.wallet.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full uppercase tracking-wide ${
                          tx.type === "INCOME"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-medium text-white">{tx.category.name}</p>
                      <p
                        className={`font-semibold ${
                          tx.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(decimalToNumber(tx.amount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

function formatCurrency(value: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
    .format(value || 0)
    .replace(/\s/g, "");
}

function formatMonthLabel(month: string) {
  const [year, monthNum] = month.split("-");
  const safeMonth = Number(monthNum);
  const safeYear = Number(year);
  const date = new Date(Date.UTC(safeYear, safeMonth - 1, 1));
  return monthFormatter.format(date);
}

function buildTrendSeries(
  txs: { type: string; amount: Prisma.Decimal | number; date: Date }[],
  from: Date
) {
  const days = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date(from);
    d.setDate(from.getDate() + idx);
    return d.toISOString().split("T")[0];
  });

  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();

  txs.forEach((tx) => {
    const key = tx.date.toISOString().split("T")[0];
    const amountNum = decimalToNumber(tx.amount);
    if (tx.type === "INCOME") {
      incomeMap.set(key, (incomeMap.get(key) || 0) + amountNum);
    } else {
      expenseMap.set(key, (expenseMap.get(key) || 0) + amountNum);
    }
  });

  const income = days.map((d) => incomeMap.get(d) || 0);
  const expense = days.map((d) => expenseMap.get(d) || 0);

  return { days, income, expense };
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-sm text-slate-400 mb-2">{title}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
      <div className={`mt-3 h-1 rounded-full bg-linear-to-r ${accent}`} />
    </div>
  );
}

function CategoryPie({
  data,
  currency,
}: {
  data: { categoryName: string; total: number }[];
  currency: string;
}) {
  const total = data.reduce((acc, item) => acc + item.total, 0);
  if (total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-sm text-slate-400">
        Belum ada pengeluaran.
      </div>
    );
  }

  const palette = [
    "#34d399", // emerald
    "#38bdf8", // sky
    "#f472b6", // pink
    "#facc15", // amber
    "#a855f7", // purple
    "#f97316", // orange
    "#22d3ee", // cyan
  ];

  const { segments } = data.reduce(
    (acc, item, index) => {
      const share = (item.total / total) * 100;
      const start = acc.angle;
      const end = start + (share / 100) * 360;
      const color = palette[index % palette.length];
      acc.angle = end;
      acc.segments.push({ ...item, start, end, color, share });
      return acc;
    },
    { angle: 0, segments: [] as Array<{ categoryName: string; total: number; start: number; end: number; color: string; share: number }> }
  );

  const gradient = segments
    .map((seg) => `${seg.color} ${seg.start}deg ${seg.end}deg`)
    .join(", ");

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative mx-auto h-44 w-44 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-4 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-sm font-semibold text-white">{formatCurrency(total, currency)}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {segments.map((seg) => (
          <div
            key={seg.categoryName}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full border border-slate-800"
                style={{ backgroundColor: seg.color }}
              />
              <p className="text-sm text-white">{seg.categoryName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">{seg.share.toFixed(1)}%</p>
              <p className="text-sm font-semibold text-rose-200">{formatCurrency(seg.total, currency)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SparklineCard({
  title,
  total,
  series,
  currency = "IDR",
  variant = "income",
}: {
  title: string;
  total: number;
  series: number[];
  currency?: string;
  variant?: "income" | "expense";
}) {
  const max = Math.max(...series, 1);
  const points = series.map((value, idx) => {
    const x = (idx / Math.max(series.length - 1, 1)) * 100;
    const y = 100 - (value / max) * 100;
    return `${x},${y}`;
  });

  const color = variant === "income" ? "#34d399" : "#f472b6";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-slate-400">{title}</p>
          <p className="text-lg font-semibold text-white">{formatCurrency(total, currency)}</p>
        </div>
        <span className="text-[11px] text-slate-500">14 hari</span>
      </div>
      <svg viewBox="0 0 100 40" className="w-full h-16">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points.length ? points.map((p) => p.replace(",", " ")).join(" ") : "0,100 100,100"}
        />
        {points.map((pt, idx) => {
          const [x, y] = pt.split(",").map(Number);
          return (
            <circle key={idx} cx={x} cy={y} r="1.6" fill={color} opacity="0.8" />
          );
        })}
      </svg>
    </div>
  );
}
