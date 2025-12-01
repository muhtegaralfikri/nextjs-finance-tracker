import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMonthRange, decimalToNumber, getWalletsWithBalance } from "@/lib/finance";
import { ensureDefaultCategories } from "@/lib/categories";
import { applyDueRecurrences } from "@/lib/recurring";
import TransactionsClient, {
  TransactionClientData,
  TransactionCategory,
  TransactionWallet,
} from "./TransactionsClient";
import AppShell from "@/components/AppShell";

export const runtime = "nodejs";

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const userId = session.user.id;

  await ensureDefaultCategories(userId);
  await applyDueRecurrences(userId);

  const walletsData = await getWalletsWithBalance(userId);
  const categoriesData = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const { from, to } = getMonthRange();
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: from, lte: to },
    },
    include: {
      wallet: true,
      category: true,
    },
    orderBy: { date: "desc" },
  });

  const initialTransactions: TransactionClientData[] = transactions.map((tx) => ({
    id: tx.id,
    walletId: tx.walletId,
    walletName: tx.wallet.name,
    categoryId: tx.categoryId,
    categoryName: tx.category.name,
    categoryType: tx.category.type,
    type: tx.type,
    amount: decimalToNumber(tx.amount),
    date: tx.date.toISOString(),
    note: tx.note || "",
  }));

  const wallets: TransactionWallet[] = walletsData.map((w) => ({
    id: w.id,
    name: w.name,
    type: w.type,
    currency: w.currency,
  }));

  const categories: TransactionCategory[] = categoriesData.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));

  const recurrencesRaw = await prisma.recurringTransaction.findMany({
    where: { userId },
    include: { wallet: true, category: true },
    orderBy: { nextRun: "asc" },
  });

  const recurrences = recurrencesRaw.map((r) => ({
    id: r.id,
    walletId: r.walletId,
    walletName: r.wallet.name,
    categoryId: r.categoryId,
    categoryName: r.category.name,
    type: r.type,
    cadence: r.cadence,
    amount: Number(r.amount),
    nextRun: r.nextRun.toISOString(),
    note: r.note,
  }));

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <div>
          <h1 className="text-3xl font-semibold">Transaksi</h1>
          <p className="text-slate-400 text-sm mt-1">
            Catat pemasukan/pengeluaran, filter per tanggal, wallet, dan kategori dengan status loading/error yang jelas.
          </p>
        </div>

        <TransactionsClient
          wallets={wallets}
          categories={categories}
          initialTransactions={initialTransactions}
          initialFrom={formatInputDate(from)}
          initialTo={formatInputDate(to)}
          initialRecurrences={recurrences}
        />
      </div>
    </AppShell>
  );
}
