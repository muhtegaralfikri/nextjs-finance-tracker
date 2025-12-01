import AppShell from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

const skeletonArray = (count: number) => Array.from({ length: count });

export default function TransactionsLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Transaksi</h1>
          <p className="text-slate-400 text-sm">
            Catat pemasukan/pengeluaran, filter per tanggal, wallet, dan kategori.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Tambah / Edit Transaksi</h2>
              <p className="text-sm text-slate-400">Income & expense dengan validasi.</p>
            </div>
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {skeletonArray(6).map((_, idx) => (
              <Skeleton key={`tx-form-${idx}`} className="h-11 w-full" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full md:w-auto">
              {skeletonArray(4).map((_, idx) => (
                <Skeleton key={`filter-${idx}`} className="h-10 w-full md:w-36" />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="hidden sm:block space-y-2">
            <Skeleton className="h-9 w-full" />
            {skeletonArray(4).map((_, idx) => (
              <Skeleton key={`tx-row-${idx}`} className="h-12 w-full" />
            ))}
          </div>
          <div className="sm:hidden space-y-2">
            {skeletonArray(4).map((_, idx) => (
              <div
                key={`tx-card-${idx}`}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2"
              >
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
