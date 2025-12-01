import AppShell from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

const stats = [
  "Total Saldo",
  "Income Bulan Ini",
  "Expense Bulan Ini",
  "Net",
];

const skeletonArray = (count: number) => Array.from({ length: count });

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header className="space-y-1">
          <p className="text-sm text-slate-400">Halo,</p>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((title) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
            >
              <p className="text-sm text-slate-400">{title}</p>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Wallets</h2>
              <span className="text-sm text-emerald-400">Kelola Wallet →</span>
            </div>
            <div className="space-y-2">
              {skeletonArray(3).map((_, idx) => (
                <div
                  key={`wallet-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Expense per Kategori</h2>
              <span className="text-xs text-slate-500">Bulan ini</span>
            </div>
            <div className="space-y-2">
              {skeletonArray(4).map((_, idx) => (
                <div
                  key={`category-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Budgets</h2>
              <span className="text-sm text-emerald-400">Kelola →</span>
            </div>
            <div className="space-y-3">
              {skeletonArray(3).map((_, idx) => (
                <div
                  key={`budget-${idx}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Savings Goals</h2>
              <span className="text-sm text-emerald-400">Kelola →</span>
            </div>
            <div className="space-y-3">
              {skeletonArray(3).map((_, idx) => (
                <div
                  key={`goal-${idx}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
            <span className="text-sm text-emerald-400">Lihat Semua →</span>
          </div>
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
              <tbody className="space-y-2">
                {skeletonArray(3).map((_, idx) => (
                  <tr key={`table-${idx}`} className="border-b border-slate-800 last:border-0">
                    <td colSpan={5} className="py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-2">
            {skeletonArray(3).map((_, idx) => (
              <div
                key={`mobile-${idx}`}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2"
              >
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
