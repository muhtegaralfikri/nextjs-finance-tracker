import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getWalletsWithBalance, decimalToNumber } from "@/lib/finance";
import WalletsClient, { WalletClientData } from "./WalletsClient";

export default async function WalletsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const wallets = await getWalletsWithBalance(session.user.id);
  const serialized: WalletClientData[] = wallets.map((w) => ({
    id: w.id,
    name: w.name,
    type: w.type,
    currency: w.currency,
    initialBalance: decimalToNumber(w.initialBalance),
    balance: decimalToNumber(w.balance),
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <div>
          <p className="text-sm text-slate-400">Phase 3</p>
          <h1 className="text-3xl font-semibold">Wallet Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Buat, edit, dan hapus wallet. Saldo dihitung dari saldo awal + transaksi.
          </p>
        </div>

        <WalletsClient initialWallets={serialized} />
      </div>
    </main>
  );
}
