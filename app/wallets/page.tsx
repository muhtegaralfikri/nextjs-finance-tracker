import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getWalletsWithBalance, decimalToNumber } from "@/lib/finance";
import WalletsClient, { WalletClientData } from "./WalletsClient";
import AppShell from "@/components/AppShell";

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
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <div>
          <h1 className="text-3xl font-semibold">Wallet Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Buat, edit, dan hapus wallet dengan feedback loading/error. Saldo dihitung dari saldo awal + transaksi.
          </p>
        </div>

        <WalletsClient initialWallets={serialized} />
      </div>
    </AppShell>
  );
}
