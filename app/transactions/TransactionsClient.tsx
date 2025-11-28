"use client";

import { useMemo, useState } from "react";
import { CategoryType, TransactionType } from "@prisma/client";

export type TransactionWallet = {
  id: string;
  name: string;
  type: string;
  currency: string;
};

export type TransactionCategory = {
  id: string;
  name: string;
  type: CategoryType;
};

export type TransactionClientData = {
  id: string;
  walletId: string;
  walletName: string;
  categoryId: string;
  categoryName: string;
  categoryType: CategoryType;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
};

export default function TransactionsClient({
  wallets,
  categories,
  initialTransactions,
  initialFrom,
  initialTo,
}: {
  wallets: TransactionWallet[];
  categories: TransactionCategory[];
  initialTransactions: TransactionClientData[];
  initialFrom: string;
  initialTo: string;
}) {
  const [transactions, setTransactions] = useState<TransactionClientData[]>(initialTransactions);
  const [filters, setFilters] = useState({
    from: initialFrom,
    to: initialTo,
    walletId: "",
    categoryId: "",
  });
  const [form, setForm] = useState({
    walletId: wallets[0]?.id || "",
    categoryId:
      categories.find((c) => c.type === TransactionType.EXPENSE)?.id || "",
    type: TransactionType.EXPENSE as TransactionType,
    amount: "",
    date: initialTo,
    note: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableCategories = useMemo(
    () => categories.filter((c) => c.type === form.type),
    [categories, form.type]
  );

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  async function loadTransactions(nextFilters?: typeof filters) {
    setLoading(true);
    setStatus(null);
    const activeFilters = nextFilters || filters;
    const params = new URLSearchParams();
    if (activeFilters.from) params.set("from", activeFilters.from);
    if (activeFilters.to) params.set("to", activeFilters.to);
    if (activeFilters.walletId) params.set("walletId", activeFilters.walletId);
    if (activeFilters.categoryId) params.set("categoryId", activeFilters.categoryId);

    const res = await fetch(`/api/transactions?${params.toString()}`);
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal memuat transaksi");
      return;
    }

    const data = await res.json();
    const normalized: TransactionClientData[] = (data.transactions || []).map(
      normalizeTransaction
    );
    setTransactions(normalized);
  }

  async function handleSubmit() {
    if (!form.walletId || !form.categoryId || !form.amount || !form.date) {
      setStatus("Lengkapi semua field");
      return;
    }

    setLoading(true);
    setStatus(null);

    const payload = {
      walletId: form.walletId,
      categoryId: form.categoryId,
      type: form.type,
      amount: Number(form.amount),
      date: form.date,
      note: form.note,
    };

    const endpoint = editingId ? `/api/transactions/${editingId}` : "/api/transactions";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal menyimpan transaksi");
      return;
    }

    const saved = await res.json();
    const normalized = normalizeTransaction(saved);

    if (editingId) {
      setTransactions((prev) => prev.map((tx) => (tx.id === editingId ? normalized : tx)));
      setStatus("Transaksi diperbarui");
    } else {
      setTransactions((prev) => [normalized, ...prev]);
      setStatus("Transaksi tersimpan");
    }

    resetForm();
  }

  function resetForm() {
    setEditingId(null);
    setForm(() => ({
      walletId: wallets[0]?.id || "",
      categoryId: categories.find((c) => c.type === TransactionType.EXPENSE)?.id || "",
      type: TransactionType.EXPENSE,
      amount: "",
      date: initialTo,
      note: "",
    }));
  }

  function startEdit(tx: TransactionClientData) {
    setEditingId(tx.id);
    setForm({
      walletId: tx.walletId,
      categoryId: tx.categoryId,
      type: tx.type,
      amount: String(tx.amount),
      date: tx.date.slice(0, 10),
      note: tx.note || "",
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    setLoading(true);
    setStatus(null);

    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal menghapus transaksi");
      return;
    }

    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    setStatus("Transaksi dihapus");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Tambah / Edit Transaksi</h2>
        {status && <p className="text-sm text-emerald-300">{status}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Tipe</label>
            <select
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.type}
              onChange={(e) => {
                const nextType = e.target.value as TransactionType;
                const fallbackCategory =
                  categories.find((c) => c.type === nextType)?.id || "";
                setForm((prev) => ({
                  ...prev,
                  type: nextType,
                  categoryId: fallbackCategory,
                }));
              }}
            >
              <option value={TransactionType.EXPENSE}>Expense</option>
              <option value={TransactionType.INCOME}>Income</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Wallet</label>
            <select
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.walletId}
              onChange={(e) => setForm((prev) => ({ ...prev, walletId: e.target.value }))}
            >
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Kategori</label>
            <select
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            >
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Jumlah</label>
            <input
              type="number"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="100000"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Tanggal</label>
            <input
              type="date"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Catatan</label>
            <input
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="opsional"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2 text-sm disabled:opacity-60"
          >
            {editingId ? "Simpan perubahan" : "Tambah transaksi"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              Batal edit
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Filter</h2>
            <p className="text-xs text-slate-400">Default: bulan ini</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              type="date"
              className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            />
            <input
              type="date"
              className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
            />
            <select
              className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={filters.walletId}
              onChange={(e) => setFilters((prev) => ({ ...prev, walletId: e.target.value }))}
            >
              <option value="">Semua wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={filters.categoryId}
              onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
            >
              <option value="">Semua kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadTransactions()}
              disabled={loading}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white border border-slate-700 hover:border-emerald-400"
            >
              Terapkan filter
            </button>
            <button
              onClick={() => {
                const reset = { from: initialFrom, to: initialTo, walletId: "", categoryId: "" };
                setFilters(reset);
                loadTransactions(reset);
              }}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Daftar Transaksi</h2>
          <span className="text-xs text-slate-500">{transactions.length} transaksi</span>
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
                <th className="py-2">Catatan</th>
                <th className="py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400">
                    Tidak ada transaksi.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-800">
                    <td className="py-2 text-slate-300">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-2">{tx.walletName}</td>
                    <td className="py-2">{tx.categoryName}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tx.type === TransactionType.INCOME
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
                          tx.type === TransactionType.INCOME
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }
                      >
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-2 text-slate-400">{tx.note}</td>
                    <td className="py-2 text-right space-x-2">
                      <button
                        onClick={() => startEdit(tx)}
                        className="text-xs rounded-lg border border-slate-700 px-3 py-1 text-slate-200 hover:border-emerald-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-xs rounded-lg border border-rose-500/60 px-3 py-1 text-rose-200 hover:bg-rose-500/10"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type ApiTransaction = {
  id: string;
  walletId: string;
  categoryId: string;
  wallet?: { name: string };
  category?: { name: string; type: CategoryType };
  walletName?: string;
  categoryName?: string;
  categoryType?: CategoryType;
  type: TransactionType;
  amount: number | string;
  date: string | Date;
  note?: string | null;
};

function normalizeTransaction(tx: ApiTransaction): TransactionClientData {
  return {
    id: tx.id,
    walletId: tx.walletId,
    walletName: tx.wallet?.name || tx.walletName || "Wallet",
    categoryId: tx.categoryId,
    categoryName: tx.category?.name || tx.categoryName || "Kategori",
    categoryType: tx.category?.type || tx.categoryType || CategoryType.EXPENSE,
    type: tx.type,
    amount: Number(tx.amount),
    date: typeof tx.date === "string" ? tx.date : new Date(tx.date).toISOString(),
    note: tx.note || "",
  };
}
