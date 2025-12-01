import AppShell from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

const skeletonArray = (count: number) => Array.from({ length: count });

export default function BudgetsLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Budgets & Savings Goals</h1>
          <p className="text-slate-400 text-sm">
            Tetapkan batas pengeluaran per kategori dan target tabungan.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Tambah Budget Bulanan</h2>
            <p className="text-sm text-slate-400">
              Budget per kategori expense. Progress dihitung dari pengeluaran di bulan terkait.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {skeletonArray(3).map((_, idx) => (
              <Skeleton key={`budget-form-${idx}`} className="h-11 w-full" />
            ))}
            <Skeleton className="h-11 w-full" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Budget Bulan Ini</h2>
                <p className="text-sm text-slate-400">Filter per bulan untuk melihat progres.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>

            <div className="space-y-3">
              {skeletonArray(3).map((_, idx) => (
                <div
                  key={`budget-${idx}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-3 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-16" />
                      <Skeleton className="h-9 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Savings Goals</h2>
              <p className="text-sm text-slate-400">Tetapkan target tabungan dan pantau progres.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Skeleton className="h-11 w-full md:col-span-2" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full md:col-span-4" />
              <Skeleton className="h-11 w-full md:col-span-1" />
            </div>
            <div className="space-y-3">
              {skeletonArray(3).map((_, idx) => (
                <div
                  key={`goal-${idx}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-16" />
                      <Skeleton className="h-9 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
