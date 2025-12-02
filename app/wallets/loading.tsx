import AppShell from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

const skeletonArray = (count: number) => Array.from({ length: count });

export default function WalletsLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Wallet Management</h1>
          <p className="text-slate-400 text-sm">
            Kelola dompet cash, bank, dan e-wallet dengan saldo yang selalu terbarui.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Tambah Wallet</h2>
            <p className="text-sm text-slate-400">
              Kelola semua dompet (cash, bank, e-wallet) dengan saldo awal yang jelas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skeletonArray(4).map((_, idx) => (
              <Skeleton key={`form-${idx}`} className="h-11 w-full" />
            ))}
            <div className="md:col-span-2">
              <Skeleton className="h-11 w-40" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Daftar Wallet</h2>
              <p className="text-sm text-slate-400">Saldo selalu terbarui dari transaksi terakhir.</p>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {skeletonArray(3).map((_, idx) => (
              <div
                key={`wallet-${idx}`}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-28" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
