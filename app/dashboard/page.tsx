// src/app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/finance";
import { getMonthlySummary } from "@/lib/summary";
import { ensureDefaultCategories } from "@/lib/categories";

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-2">
          <p className="text-sm text-slate-400">Halo,</p>
          <h1 className="text-3xl font-semibold text-white">{nameOrEmail}</h1>
          <p className="text-slate-400 text-sm">
            Ringkasan keuanganmu bulan {summary.month}. Kelola dompet, catat
            transaksi, dan pantau pengeluaran per kategori.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Saldo"
            value={formatCurrency(summary.totalBalance)}
            accent="from-emerald-500/80 to-emerald-400/60"
          />
          <StatCard
            title="Income Bulan Ini"
            value={formatCurrency(summary.totalIncome)}
            accent="from-sky-500/80 to-sky-400/60"
          />
          <StatCard
            title="Expense Bulan Ini"
            value={formatCurrency(summary.totalExpense)}
            accent="from-rose-500/80 to-rose-400/60"
          />
          <StatCard
            title="Net"
            value={formatCurrency(summary.net)}
            accent={summary.net >= 0 ? "from-emerald-500/80 to-emerald-400/60" : "from-amber-500/80 to-amber-400/60"}
          />
        </section>

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
                        {wallet.type} • {wallet.currency}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-400">
                      {formatCurrency(decimalToNumber(wallet.balance))}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Expense per Kategori</h2>
              <span className="text-xs text-slate-500">Bulan {summary.month}</span>
            </div>
            <div className="space-y-2">
              {summary.byCategory.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Belum ada pengeluaran bulan ini.
                </p>
              ) : (
                summary.byCategory.map((item) => (
                  <div
                    key={item.categoryId}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                  >
                    <p className="text-sm">{item.categoryName}</p>
                    <p className="text-sm font-semibold text-rose-300">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Wallet</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2">Tipe</th>
                  <th className="py-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      Belum ada transaksi.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-slate-800">
                      <td className="py-2 text-slate-300">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="py-2">{tx.wallet.name}</td>
                      <td className="py-2">{tx.category.name}</td>
                      <td className="py-2">
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
                      <td className="py-2 text-right font-semibold">
                        <span
                          className={
                            tx.type === "INCOME" ? "text-emerald-300" : "text-rose-300"
                          }
                        >
                          {formatCurrency(decimalToNumber(tx.amount))}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
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
