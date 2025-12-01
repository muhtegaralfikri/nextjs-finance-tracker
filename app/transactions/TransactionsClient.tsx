"use client";

import { useEffect, useMemo, useState } from "react";
import { CategoryType, RecurringCadence, TransactionType } from "@prisma/client";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";

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

export type RecurringClientData = {
  id: string;
  walletId: string;
  walletName: string;
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  cadence: RecurringCadence;
  amount: number;
  nextRun: string;
  note?: string | null;
};

export default function TransactionsClient({
  wallets,
  categories,
  initialTransactions,
  initialFrom,
  initialTo,
  initialRecurrences,
}: {
  wallets: TransactionWallet[];
  categories: TransactionCategory[];
  initialTransactions: TransactionClientData[];
  initialFrom: string;
  initialTo: string;
  initialRecurrences: RecurringClientData[];
}) {
  const [transactions, setTransactions] = useState<TransactionClientData[]>(initialTransactions);
  const [recurrences, setRecurrences] = useState<RecurringClientData[]>(initialRecurrences);
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
  const [recurringForm, setRecurringForm] = useState({
    walletId: wallets[0]?.id || "",
    type: TransactionType.EXPENSE as TransactionType,
    categoryId:
      categories.find((c) => c.type === TransactionType.EXPENSE)?.id || "",
    amount: "",
    cadence: RecurringCadence.MONTHLY as RecurringCadence,
    nextRun: initialTo,
    note: "",
  });
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const availableCategories = useMemo(
    () => categories.filter((c) => c.type === form.type),
    [categories, form.type]
  );
  const recurringCategories = useMemo(
    () => categories.filter((c) => c.type === recurringForm.type),
    [categories, recurringForm.type]
  );

  useEffect(() => {
    const fallback = recurringCategories[0]?.id || "";
    if (fallback && recurringForm.categoryId !== fallback) {
      setRecurringForm((prev) => ({ ...prev, categoryId: fallback }));
    }
  }, [recurringCategories, recurringForm.categoryId]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("id-ID", { timeZone: "UTC" }),
    []
  );

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    })
      .format(value || 0)
      .replace(/\s/g, "");
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

    try {
      const res = await fetch(`/api/transactions?${params.toString()}`);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal memuat transaksi" });
        return;
      }

      const data = await res.json();
      const normalized: TransactionClientData[] = (data.transactions || []).map(
        normalizeTransaction
      );
      setTransactions(normalized);
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  async function loadRecurrences() {
    setRecurringLoading(true);
    try {
      const res = await fetch("/api/recurring");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal memuat transaksi berulang" });
        return;
      }
      const data = await res.json();
      const normalized: RecurringClientData[] = (data.recurrences || []).map(normalizeRecurring);
      setRecurrences(normalized);
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa memuat recurring" });
    } finally {
      setRecurringLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form.walletId || !form.categoryId || !form.amount || !form.date) {
      setStatus({ type: "error", message: "Lengkapi semua field" });
      return;
    }

    if (Number(form.amount) <= 0) {
      setStatus({ type: "error", message: "Jumlah harus lebih dari 0" });
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

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal menyimpan transaksi" });
        return;
      }

      const saved = await res.json();
      const normalized = normalizeTransaction(saved);

      if (editingId) {
        setTransactions((prev) => prev.map((tx) => (tx.id === editingId ? normalized : tx)));
        setStatus({ type: "success", message: "Transaksi diperbarui" });
      } else {
        setTransactions((prev) => [normalized, ...prev]);
        setStatus({ type: "success", message: "Transaksi tersimpan" });
      }

      resetForm();
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
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

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal menghapus transaksi" });
        return;
      }

      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      setStatus({ type: "success", message: "Transaksi dihapus" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRecurring() {
    if (!recurringForm.walletId || !recurringForm.categoryId || !recurringForm.amount) {
      setStatus({ type: "error", message: "Lengkapi data recurring" });
      return;
    }
    if (Number(recurringForm.amount) <= 0) {
      setStatus({ type: "error", message: "Nominal recurring harus lebih dari 0" });
      return;
    }

    setRecurringLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: recurringForm.walletId,
          categoryId: recurringForm.categoryId,
          type: recurringForm.type,
          amount: Number(recurringForm.amount),
          cadence: recurringForm.cadence,
          nextRun: recurringForm.nextRun,
          note: recurringForm.note || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal membuat recurring" });
        return;
      }

      const created = normalizeRecurring(await res.json());
      setRecurrences((prev) => [created, ...prev]);
      setRecurringForm((prev) => ({ ...prev, amount: "", note: "" }));
      setStatus({ type: "success", message: "Recurring disimpan" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setRecurringLoading(false);
    }
  }

  async function handleDeleteRecurring(id: string) {
    if (!confirm("Hapus transaksi berulang ini?")) return;
    setRecurringLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal menghapus recurring" });
        return;
      }
      setRecurrences((prev) => prev.filter((r) => r.id !== id));
      setStatus({ type: "success", message: "Recurring dihapus" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setRecurringLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.walletId) params.set("walletId", filters.walletId);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);

      const res = await fetch(`/api/transactions/export?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal mengekspor Excel" });
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transactions.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
      setStatus({ type: "success", message: "Berhasil ekspor Excel" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa mengekspor Excel" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Tambah / Edit Transaksi</CardTitle>
            <CardDescription>Income & expense dengan validasi realtime.</CardDescription>
          </div>
          {status && (
            <Alert
              variant={status.type === "success" ? "success" : "error"}
              className="sm:w-[260px]"
            >
              {status.message}
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Tipe</label>
              <Select
                value={form.type}
                onChange={(e) => {
                  const nextType = e.target.value as TransactionType;
                  const fallbackCategory = categories.find((c) => c.type === nextType)?.id || "";
                  setForm((prev) => ({
                    ...prev,
                    type: nextType,
                    categoryId: fallbackCategory,
                  }));
                }}
              >
                <option value={TransactionType.EXPENSE}>Expense</option>
                <option value={TransactionType.INCOME}>Income</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Wallet</label>
              <Select
                value={form.walletId}
                onChange={(e) => setForm((prev) => ({ ...prev, walletId: e.target.value }))}
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Kategori</label>
              <Select
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Jumlah</label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="100000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Tanggal</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Catatan</label>
              <Input
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="opsional"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} loading={loading}>
              {editingId ? "Simpan perubahan" : "Tambah transaksi"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Batal edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Filter</CardTitle>
            <CardDescription>Default: bulan ini</CardDescription>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full md:w-auto">
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            />
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
            />
            <Select
              value={filters.walletId}
              onChange={(e) => setFilters((prev) => ({ ...prev, walletId: e.target.value }))}
            >
              <option value="">Semua wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </Select>
            <Select
              value={filters.categoryId}
              onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
            >
              <option value="">Semua kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => loadTransactions()} loading={loading}>
              Terapkan filter
            </Button>
            <Button type="button" variant="outline" onClick={handleExport} loading={exporting}>
              Export Excel
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const reset = { from: initialFrom, to: initialTo, walletId: "", categoryId: "" };
                setFilters(reset);
                loadTransactions(reset);
              }}
            >
              Reset
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Transaksi Berulang</CardTitle>
            <CardDescription>Auto-generate pada tanggal jatuh tempo.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={loadRecurrences} loading={recurringLoading}>
            Muat ulang recurring
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Tipe</label>
              <Select
                value={recurringForm.type}
                onChange={(e) =>
                  setRecurringForm((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType,
                  }))
                }
              >
                <option value={TransactionType.EXPENSE}>Expense</option>
                <option value={TransactionType.INCOME}>Income</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Wallet</label>
              <Select
                value={recurringForm.walletId}
                onChange={(e) => setRecurringForm((prev) => ({ ...prev, walletId: e.target.value }))}
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Kategori</label>
              <Select
                value={recurringForm.categoryId}
                onChange={(e) =>
                  setRecurringForm((prev) => ({ ...prev, categoryId: e.target.value }))
                }
              >
                {recurringCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Nominal</label>
              <Input
                type="number"
                value={recurringForm.amount}
                onChange={(e) => setRecurringForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="50000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Frekuensi</label>
              <Select
                value={recurringForm.cadence}
                onChange={(e) =>
                  setRecurringForm((prev) => ({
                    ...prev,
                    cadence: e.target.value as RecurringCadence,
                  }))
                }
              >
                <option value={RecurringCadence.DAILY}>Harian</option>
                <option value={RecurringCadence.WEEKLY}>Mingguan</option>
                <option value={RecurringCadence.MONTHLY}>Bulanan</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Mulai</label>
              <Input
                type="date"
                value={recurringForm.nextRun}
                onChange={(e) => setRecurringForm((prev) => ({ ...prev, nextRun: e.target.value }))}
              />
            </div>
            <div className="space-y-1 md:col-span-3">
              <label className="text-sm text-slate-300">Catatan</label>
              <Input
                value={recurringForm.note}
                onChange={(e) => setRecurringForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="opsional"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleCreateRecurring} loading={recurringLoading}>
              Simpan Recurring
            </Button>
          </div>

          <div className="space-y-3">
            {recurrences.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada recurring.</p>
            ) : (
              recurrences.map((recurring) => (
                <div
                  key={recurring.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {recurring.walletName} • {recurring.categoryName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {recurring.type} • {recurring.cadence} • Mulai {recurring.nextRun.slice(0, 10)}
                    </p>
                    <p className="text-sm text-slate-300">
                      {formatCurrency(recurring.amount)}{" "}
                      {recurring.note ? <span className="text-slate-400">• {recurring.note}</span> : null}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleDeleteRecurring(recurring.id)}
                    loading={recurringLoading}
                  >
                    Hapus
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Daftar Transaksi</CardTitle>
          <span className="text-xs text-slate-500">{transactions.length} transaksi</span>
        </div>
        <div className="hidden sm:block overflow-x-auto">
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
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2 justify-center">
                      <Spinner size="sm" /> Memuat transaksi...
                    </span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400">
                    Tidak ada transaksi.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-800">
                    <td className="py-2 text-slate-300">
                      {dateFormatter.format(new Date(tx.date))}
                    </td>
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
                    <td className="py-2 text-slate-400 whitespace-pre-line pl-2">
                      {tx.note}
                    </td>
                    <td className="py-2 text-right space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => startEdit(tx)}
                        className="px-3 py-1"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleDelete(tx.id)}
                        className="px-3 py-1"
                        loading={loading && editingId === tx.id}
                      >
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden space-y-2">
          {loading && transactions.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" /> Memuat transaksi...
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada transaksi.</p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{tx.walletName}</p>
                    <p className="text-xs text-slate-400">
                      {tx.categoryName} • {dateFormatter.format(new Date(tx.date))}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      tx.type === TransactionType.INCOME
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {tx.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold">
                    <span
                      className={
                        tx.type === TransactionType.INCOME ? "text-emerald-300" : "text-rose-300"
                      }
                    >
                      {formatCurrency(tx.amount)}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => startEdit(tx)}
                      className="px-3 py-1 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDelete(tx.id)}
                      className="px-3 py-1 text-xs"
                      loading={loading && editingId === tx.id}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
                {tx.note && <p className="text-xs text-slate-400 mt-1">{tx.note}</p>}
              </div>
            ))
          )}
        </div>

        {loading && transactions.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <Spinner size="sm" /> Memproses...
          </div>
        )}
      </Card>
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

type ApiRecurring = {
  id: string;
  walletId: string;
  categoryId: string;
  wallet?: { name: string };
  category?: { name: string };
  walletName?: string;
  categoryName?: string;
  type: TransactionType;
  cadence: RecurringCadence;
  amount: number | string;
  nextRun: string | Date;
  note?: string | null;
};

function normalizeRecurring(recurring: ApiRecurring): RecurringClientData {
  return {
    id: recurring.id,
    walletId: recurring.walletId,
    walletName: recurring.wallet?.name || recurring.walletName || "Wallet",
    categoryId: recurring.categoryId,
    categoryName: recurring.category?.name || recurring.categoryName || "Kategori",
    type: recurring.type,
    cadence: recurring.cadence,
    amount: Number(recurring.amount),
    nextRun:
      typeof recurring.nextRun === "string"
        ? recurring.nextRun
        : new Date(recurring.nextRun).toISOString(),
    note: recurring.note || null,
  };
}
