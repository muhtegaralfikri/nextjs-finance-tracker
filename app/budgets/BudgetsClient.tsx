"use client";

import { useState } from "react";

export type BudgetItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  progress: number;
};

export type BudgetCategory = {
  id: string;
  name: string;
};

export default function BudgetsClient({
  initialBudgets,
  categories,
  initialMonth,
}: {
  initialBudgets: BudgetItem[];
  categories: BudgetCategory[];
  initialMonth: string;
}) {
  const [budgets, setBudgets] = useState<BudgetItem[]>(initialBudgets);
  const [month, setMonth] = useState(initialMonth);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    categoryId: categories[0]?.id || "",
    month: initialMonth,
    amount: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    month: initialMonth,
  });

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  async function loadBudgets(nextMonth: string) {
    setLoading(true);
    setStatus(null);
    const params = new URLSearchParams();
    if (nextMonth) params.set("month", nextMonth);
    const res = await fetch(`/api/budgets?${params.toString()}`);
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal memuat budget");
      return;
    }

    const data = await res.json();
    const normalized: BudgetItem[] = (data.budgets || []).map(normalizeBudget);
    setBudgets(normalized);
    if (data.month) setMonth(data.month);
  }

  async function handleCreate() {
    if (!form.categoryId || !form.month || !form.amount) {
      setStatus("Lengkapi semua field");
      return;
    }
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: form.categoryId,
        month: form.month,
        amount: Number(form.amount),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal membuat budget");
      return;
    }

    const created = normalizeBudget(await res.json());
    if (created.month !== month) {
      setMonth(created.month);
      loadBudgets(created.month);
    } else {
      setBudgets((prev) => [created, ...prev]);
    }
    setForm((prev) => ({ ...prev, amount: "" }));
    setStatus("Budget tersimpan");
  }

  function startEdit(item: BudgetItem) {
    setEditingId(item.id);
    setEditForm({
      amount: String(item.amount),
      month: item.month,
    });
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setLoading(true);
    setStatus(null);
    const res = await fetch(`/api/budgets/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(editForm.amount),
        month: editForm.month,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal memperbarui budget");
      return;
    }

    const updated = normalizeBudget(await res.json());
    if (updated.month !== month) {
      setEditingId(null);
      setMonth(updated.month);
      loadBudgets(updated.month);
      return;
    }

    setBudgets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingId(null);
    setStatus("Budget diperbarui");
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus budget ini?")) return;
    setLoading(true);
    setStatus(null);
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal menghapus budget");
      return;
    }

    setBudgets((prev) => prev.filter((b) => b.id !== id));
    setStatus("Budget dihapus");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Tambah Budget Bulanan</h2>
          <p className="text-sm text-slate-400">
            Budget per kategori expense. Progress dihitung dari pengeluaran di bulan terkait.
          </p>
        </div>
        {status && <p className="text-sm text-emerald-300">{status}</p>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
            value={form.categoryId}
            onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="month"
            className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
            value={form.month}
            onChange={(e) => setForm((prev) => ({ ...prev, month: e.target.value }))}
          />
          <input
            type="number"
            className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="Jumlah budget"
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2 text-sm disabled:opacity-60"
          >
            Simpan
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Budget Bulan {month}</h2>
            <p className="text-xs text-slate-400">Filter per bulan untuk melihat progres.</p>
          </div>
          <div className="flex gap-2">
            <input
              type="month"
              className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <button
              onClick={() => loadBudgets(month)}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-emerald-400"
            >
              Terapkan
            </button>
          </div>
        </div>

        {budgets.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada budget untuk bulan ini.</p>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-white font-semibold">{budget.categoryName}</p>
                    <p className="text-xs text-slate-400">Bulan {budget.month}</p>
                    <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${budget.spent > budget.amount ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(budget.progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-300 mt-1">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}{" "}
                      {budget.spent > budget.amount && (
                        <span className="text-rose-300 ml-1">(over budget)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Sisa: {formatCurrency(budget.remaining)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(budget)}
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="rounded-lg border border-rose-500/60 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {editingId === budget.id && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="number"
                      className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, amount: e.target.value }))
                      }
                    />
                    <input
                      type="month"
                      className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white"
                      value={editForm.month}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, month: e.target.value }))
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2 text-sm disabled:opacity-60"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type ApiBudget = {
  id: string;
  categoryId: string;
  categoryName?: string;
  category?: { name?: string };
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  progress: number;
};

function normalizeBudget(budget: ApiBudget): BudgetItem {
  return {
    id: budget.id,
    categoryId: budget.categoryId,
    categoryName: budget.category?.name || budget.categoryName || "Kategori",
    month: budget.month,
    amount: Number(budget.amount),
    spent: Number(budget.spent || 0),
    remaining: Number(budget.remaining || 0),
    progress: Number(budget.progress || 0),
  };
}
