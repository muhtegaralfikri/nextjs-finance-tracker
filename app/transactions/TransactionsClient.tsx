"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { CategoryType, RecurringCadence, TransactionType } from "@/lib/financeTypes";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { measureAsync, reportMetric } from "@/lib/metrics";

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

const PAGE_SIZE = 20;

type FiltersState = {
  from: string;
  to: string;
  walletId: string;
  categoryId: string;
};

type TransactionFormState = {
  walletId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  date: string;
  note: string;
};

type RecurringFormState = {
  walletId: string;
  type: TransactionType;
  categoryId: string;
  amount: string;
  cadence: RecurringCadence;
  nextRun: string;
  note: string;
};

export default function TransactionsClient({
  wallets,
  categories,
  initialTransactions,
  initialTotal,
  initialFrom,
  initialTo,
  initialRecurrences,
}: {
  wallets: TransactionWallet[];
  categories: TransactionCategory[];
  initialTransactions: TransactionClientData[];
  initialTotal: number;
  initialFrom: string;
  initialTo: string;
  initialRecurrences: RecurringClientData[];
}) {
  const [transactionsData, setTransactionsData] = useState<{
    transactions: TransactionClientData[];
    total: number;
  }>({ transactions: initialTransactions, total: initialTotal });
  const [recurrences, setRecurrences] = useState<RecurringClientData[]>(initialRecurrences);
  const [filters, setFilters] = useState<FiltersState>({
    from: initialFrom,
    to: initialTo,
    walletId: "",
    categoryId: "",
  });
  const [form, setForm] = useState<TransactionFormState>({
    walletId: wallets[0]?.id || "",
    categoryId: categories.find((c) => c.type === TransactionType.EXPENSE)?.id || "",
    type: TransactionType.EXPENSE as TransactionType,
    amount: "",
    date: initialTo,
    note: "",
  });
  const [recurringForm, setRecurringForm] = useState<RecurringFormState>({
    walletId: wallets[0]?.id || "",
    type: TransactionType.EXPENSE as TransactionType,
    categoryId: categories.find((c) => c.type === TransactionType.EXPENSE)?.id || "",
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
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const cacheRef = useRef<Map<string, { transactions: TransactionClientData[]; total: number }>>(
    new Map()
  );
  const recurrenceCacheRef = useRef<{ data: RecurringClientData[]; ts: number } | null>(null);
  const RECURRENCE_CACHE_TTL = 60_000;
  const [lastFetchMs, setLastFetchMs] = useState<number | null>(null);

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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((transactionsData.total || 0) / PAGE_SIZE)),
    [transactionsData.total]
  );

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const updateForm = useCallback((field: keyof TransactionFormState, value: string | TransactionType) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateRecurringForm = useCallback(
    (field: keyof RecurringFormState, value: string | TransactionType | RecurringCadence) => {
      setRecurringForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedFilters, setDebouncedFiltersState] = useState<FiltersState>(filters);

  const fetchTransactions = useCallback(
    async (filtersToUse: FiltersState, pageToUse: number) => {
      const params = new URLSearchParams();
      if (filtersToUse.from) params.set("from", filtersToUse.from);
      if (filtersToUse.to) params.set("to", filtersToUse.to);
      if (filtersToUse.walletId) params.set("walletId", filtersToUse.walletId);
      if (filtersToUse.categoryId) params.set("categoryId", filtersToUse.categoryId);
      params.set("page", String(pageToUse));
      params.set("limit", String(PAGE_SIZE));

      const key = params.toString();
      const cached = cacheRef.current.get(key);
      if (cached) {
        setTransactionsData(cached);
      }

      setIsFetching(true);
      setStatus(null);

      try {
        const { result, duration } = await measureAsync(
          "transactions_fetch",
          async () => {
            const res = await fetch(`/api/transactions?${params.toString()}`);
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              throw new Error(data?.error || "Gagal memuat transaksi");
            }
            return res.json();
          },
          { page: pageToUse, hasCache: Boolean(cached) }
        );

        const normalized: TransactionClientData[] = (result.transactions || []).map(
          normalizeTransaction
        );
        const nextState = { transactions: normalized, total: result.total || normalized.length };
        cacheRef.current.set(key, nextState);
        setTransactionsData(nextState);
        setLastFetchMs(duration);
      } catch (error) {
        console.error(error);
        setStatus({ type: "error", message: error instanceof Error ? error.message : "Tidak bisa terhubung ke server" });
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  useEffect(() => {
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      setDebouncedFiltersState(filters);
    }, 350);
    return () => {
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
  }, [filters]);

  const updateFilters = useCallback((field: keyof FiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  }, []);

  useEffect(() => {
    fetchTransactions(debouncedFilters, page);
  }, [debouncedFilters, page, fetchTransactions]);

  const handlePageChange = useCallback(
    (next: number) => {
      setPage((prev) => {
        const clamped = Math.min(Math.max(next, 1), totalPages);
        if (clamped === prev) return prev;
        return clamped;
      });
    },
    [totalPages]
  );

  async function loadRecurrences(options?: { force?: boolean }) {
    const now = Date.now();
    const cached = recurrenceCacheRef.current;
    if (!options?.force && cached && now - cached.ts < RECURRENCE_CACHE_TTL) {
      setRecurrences(cached.data);
      return;
    }

    setRecurringLoading(true);
    try {
      const { result, duration } = await measureAsync(
        "recurring_fetch",
        async () => {
          const res = await fetch("/api/recurring");
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.error || "Gagal memuat transaksi berulang");
          }
          return res.json();
        },
        { hasCache: Boolean(cached) }
      );

      const normalizedRecurrences: RecurringClientData[] = (result.recurrences || []).map(
        normalizeRecurring
      );
      recurrenceCacheRef.current = { data: normalizedRecurrences, ts: Date.now() };
      setRecurrences(normalizedRecurrences);
      reportMetric({ name: "recurring_fetch_done", duration, meta: { count: normalizedRecurrences.length } });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Tidak bisa memuat recurring" });
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

    setIsSaving(true);
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

      setStatus({ type: "success", message: editingId ? "Transaksi diperbarui" : "Transaksi tersimpan" });
      await fetchTransactions(debouncedFilters, 1);
      setPage(1);

      resetForm();
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setIsSaving(false);
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
    setDeletingId(id);
    setStatus(null);

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal menghapus transaksi" });
        return;
      }

      await fetchTransactions(debouncedFilters, page);
      setStatus({ type: "success", message: "Transaksi dihapus" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setDeletingId(null);
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
      setRecurrences((prev) => {
        const next = [created, ...prev];
        recurrenceCacheRef.current = { data: next, ts: Date.now() };
        return next;
      });
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
      setRecurrences((prev) => {
        const next = prev.filter((r) => r.id !== id);
        recurrenceCacheRef.current = { data: next, ts: Date.now() };
        return next;
      });
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

      const exportTask = async () => {
        const res = await fetch(`/api/transactions/export?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Gagal mengekspor Excel");
        }
        return res.blob();
      };

      const { result: blob, duration } = await measureAsync("transactions_export", exportTask);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transactions.xlsx";
      requestIdleCallback(() => {
        link.click();
        window.URL.revokeObjectURL(url);
      });
      reportMetric({ name: "transactions_export_done", duration, meta: { size: blob.size } });
      setStatus({ type: "success", message: "Berhasil ekspor Excel" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Tidak bisa mengekspor Excel" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <TransactionFormSection
        status={status}
        wallets={wallets}
        availableCategories={availableCategories}
        form={form}
        editingId={editingId}
        loading={isSaving}
        onTypeChange={(type) => {
          const fallbackCategory = categories.find((c) => c.type === type)?.id || "";
          updateForm("type", type);
          updateForm("categoryId", fallbackCategory);
        }}
        onWalletChange={(value) => updateForm("walletId", value)}
        onCategoryChange={(value) => updateForm("categoryId", value)}
        onAmountChange={(value) => updateForm("amount", value)}
        onDateChange={(value) => updateForm("date", value)}
        onNoteChange={(value) => updateForm("note", value)}
        onSubmit={handleSubmit}
        onReset={resetForm}
      />

      <FilterSection
        filters={filters}
        wallets={wallets}
        categories={categories}
        loading={isFetching}
        exporting={exporting}
        onFilterChange={updateFilters}
        onApply={() => {
          if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
          setDebouncedFiltersState(filters);
        }}
        onExport={handleExport}
        onReset={() => {
          const reset = { from: initialFrom, to: initialTo, walletId: "", categoryId: "" };
          setFilters(reset);
          setDebouncedFiltersState(reset);
          setPage(1);
        }}
      />

      <RecurringSection
        wallets={wallets}
        recurringCategories={recurringCategories}
        recurrences={recurrences}
        recurringForm={recurringForm}
        recurringLoading={recurringLoading}
        onTypeChange={(value) =>
          updateRecurringForm("type", value as TransactionType)
        }
        onWalletChange={(value) => updateRecurringForm("walletId", value)}
        onCategoryChange={(value) => updateRecurringForm("categoryId", value)}
        onAmountChange={(value) => updateRecurringForm("amount", value)}
        onCadenceChange={(value) =>
          updateRecurringForm("cadence", value as RecurringCadence)
        }
        onNextRunChange={(value) => updateRecurringForm("nextRun", value)}
        onNoteChange={(value) => updateRecurringForm("note", value)}
        onCreateRecurring={handleCreateRecurring}
        onDeleteRecurring={handleDeleteRecurring}
        onReloadRecurring={() => loadRecurrences({ force: true })}
      />

      <TransactionsList
        transactions={transactionsData.transactions}
        total={transactionsData.total}
        loading={isFetching}
        deletingId={deletingId}
        onEdit={startEdit}
        onDelete={handleDelete}
        page={page}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
        lastFetchMs={lastFetchMs}
      />
    </div>
  );
}

const TransactionFormSection = memo(function TransactionFormSection({
  status,
  wallets,
  availableCategories,
  form,
  editingId,
  loading,
  onTypeChange,
  onWalletChange,
  onCategoryChange,
  onAmountChange,
  onDateChange,
  onNoteChange,
  onSubmit,
  onReset,
}: {
  status: { type: "success" | "error"; message: string } | null;
  wallets: TransactionWallet[];
  availableCategories: TransactionCategory[];
  form: TransactionFormState;
  editingId: string | null;
  loading: boolean;
  onTypeChange: (value: TransactionType) => void;
  onWalletChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}) {
  return (
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
              onChange={(e) => onTypeChange(e.target.value as TransactionType)}
            >
              <option value={TransactionType.EXPENSE}>Expense</option>
              <option value={TransactionType.INCOME}>Income</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Wallet</label>
            <Select
              value={form.walletId}
              onChange={(e) => onWalletChange(e.target.value)}
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
              onChange={(e) => onCategoryChange(e.target.value)}
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
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="100000"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Tanggal</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Catatan</label>
            <Input
              value={form.note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="opsional"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onSubmit} loading={loading}>
            {editingId ? "Simpan perubahan" : "Tambah transaksi"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={onReset}>
              Batal edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const FilterSection = memo(function FilterSection({
  filters,
  wallets,
  categories,
  loading,
  exporting,
  onFilterChange,
  onApply,
  onExport,
  onReset,
}: {
  filters: FiltersState;
  wallets: TransactionWallet[];
  categories: TransactionCategory[];
  loading: boolean;
  exporting: boolean;
  onFilterChange: (field: keyof FiltersState, value: string) => void;
  onApply: () => void;
  onExport: () => void;
  onReset: () => void;
}) {
  return (
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
            onChange={(e) => onFilterChange("from", e.target.value)}
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => onFilterChange("to", e.target.value)}
          />
          <Select
            value={filters.walletId}
            onChange={(e) => onFilterChange("walletId", e.target.value)}
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
            onChange={(e) => onFilterChange("categoryId", e.target.value)}
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
          <Button type="button" variant="outline" onClick={onApply} loading={loading}>
            Terapkan filter
          </Button>
          <Button type="button" variant="outline" onClick={onExport} loading={exporting}>
            Export Excel
          </Button>
          <Button type="button" variant="ghost" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
});

const RecurringSection = memo(function RecurringSection({
  wallets,
  recurringCategories,
  recurrences,
  recurringForm,
  recurringLoading,
  onTypeChange,
  onWalletChange,
  onCategoryChange,
  onAmountChange,
  onCadenceChange,
  onNextRunChange,
  onNoteChange,
  onCreateRecurring,
  onDeleteRecurring,
  onReloadRecurring,
}: {
  wallets: TransactionWallet[];
  recurringCategories: TransactionCategory[];
  recurrences: RecurringClientData[];
  recurringForm: RecurringFormState;
  recurringLoading: boolean;
  onTypeChange: (value: TransactionType) => void;
  onWalletChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAmountChange: (value: string) => void;
    onCadenceChange: (value: RecurringCadence) => void;
    onNextRunChange: (value: string) => void;
    onNoteChange: (value: string) => void;
    onCreateRecurring: () => void;
    onDeleteRecurring: (id: string) => void;
    onReloadRecurring: () => void;
  }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Transaksi Berulang</CardTitle>
          <CardDescription>Auto-generate pada tanggal jatuh tempo.</CardDescription>
        </div>
        <Button type="button" variant="outline" onClick={onReloadRecurring} loading={recurringLoading}>
          Muat ulang recurring
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Tipe</label>
            <Select value={recurringForm.type} onChange={(e) => onTypeChange(e.target.value as TransactionType)}>
              <option value={TransactionType.EXPENSE}>Expense</option>
              <option value={TransactionType.INCOME}>Income</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Wallet</label>
            <Select value={recurringForm.walletId} onChange={(e) => onWalletChange(e.target.value)}>
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
              onChange={(e) => onCategoryChange(e.target.value)}
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
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="50000"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Frekuensi</label>
            <Select value={recurringForm.cadence} onChange={(e) => onCadenceChange(e.target.value as RecurringCadence)}>
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
              onChange={(e) => onNextRunChange(e.target.value)}
            />
          </div>
          <div className="space-y-1 md:col-span-3">
            <label className="text-sm text-slate-300">Catatan</label>
            <Input
              value={recurringForm.note || ""}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="opsional"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onCreateRecurring} loading={recurringLoading}>
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
                  onClick={() => onDeleteRecurring(recurring.id)}
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
  );
});

const TransactionsList = memo(function TransactionsList({
  transactions,
  total,
  loading,
  deletingId,
  onEdit,
  onDelete,
  page,
  totalPages,
  pageSize,
  onPageChange,
  lastFetchMs,
}: {
  transactions: TransactionClientData[];
  total: number;
  loading: boolean;
  deletingId: string | null;
  onEdit: (tx: TransactionClientData) => void;
  onDelete: (id: string) => void;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  lastFetchMs: number | null;
}) {
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardTitle>Daftar Transaksi</CardTitle>
        <span className="text-xs text-slate-500">{total} transaksi</span>
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
                  <td className="py-2 text-slate-300">{formatDate(tx.date)}</td>
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
                  <td className="py-2 text-slate-400 whitespace-pre-line pl-2">{tx.note}</td>
                  <td className="py-2 text-right space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onEdit(tx)}
                      className="px-3 py-1"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => onDelete(tx.id)}
                      className="px-3 py-1"
                      loading={deletingId === tx.id}
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
                    {tx.categoryName} • {formatDate(tx.date)}
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
                    onClick={() => onEdit(tx)}
                    className="px-3 py-1 text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => onDelete(tx.id)}
                    className="px-3 py-1 text-xs"
                    loading={deletingId === tx.id}
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

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Menampilkan {showingFrom}-{showingTo} dari {total}
          {lastFetchMs !== null ? ` • fetch ${Math.round(lastFetchMs)}ms` : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Prev
          </Button>
          <span className="text-xs text-slate-400">
            Hal {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
});

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
