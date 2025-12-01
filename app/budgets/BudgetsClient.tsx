"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";

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
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
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
    })
      .format(value || 0)
      .replace(/\s/g, "");
  }

  async function loadBudgets(nextMonth: string) {
    setLoading(true);
    setStatus(null);
    try {
      const params = new URLSearchParams();
      if (nextMonth) params.set("month", nextMonth);
      const res = await fetch(`/api/budgets?${params.toString()}`);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal memuat budget" });
        return;
      }

      const data = await res.json();
      const normalized: BudgetItem[] = (data.budgets || []).map(normalizeBudget);
      setBudgets(normalized);
      if (data.month) setMonth(data.month);
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.categoryId || !form.month || !form.amount) {
      setStatus({ type: "error", message: "Lengkapi semua field" });
      return;
    }

    if (Number(form.amount) <= 0) {
      setStatus({ type: "error", message: "Amount harus lebih dari 0" });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId,
          month: form.month,
          amount: Number(form.amount),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal membuat budget" });
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
      setStatus({ type: "success", message: "Budget tersimpan" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
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
    try {
      const res = await fetch(`/api/budgets/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(editForm.amount),
          month: editForm.month,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal memperbarui budget" });
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
      setStatus({ type: "success", message: "Budget diperbarui" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus budget ini?")) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal menghapus budget" });
        return;
      }

      setBudgets((prev) => prev.filter((b) => b.id !== id));
      setStatus({ type: "success", message: "Budget dihapus" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Budget Bulanan</CardTitle>
          <CardDescription>
            Budget per kategori expense. Progress dihitung dari pengeluaran di bulan terkait.
          </CardDescription>
        </CardHeader>
        {status && (
          <Alert variant={status.type === "success" ? "success" : "error"} className="mb-3">
            {status.message}
          </Alert>
        )}
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <Select
            value={form.categoryId}
            onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <Input
            type="month"
            value={form.month}
            onChange={(e) => setForm((prev) => ({ ...prev, month: e.target.value }))}
          />
          <Input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="Jumlah budget"
          />
          <Button type="submit" loading={loading}>
            Simpan
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Budget Bulan {month}</CardTitle>
            <CardDescription>Filter per bulan untuk melihat progres.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="sm:max-w-[180px]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => loadBudgets(month)}
              loading={loading}
              className="sm:w-auto"
            >
              Terapkan
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {budgets.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada budget untuk bulan ini.</p>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => (
                <Card key={budget.id} className="bg-slate-950/60 border-slate-800">
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
                      <Button type="button" variant="outline" onClick={() => startEdit(budget)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleDelete(budget.id)}
                        loading={loading && editingId === budget.id}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>

                  {editingId === budget.id && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, amount: e.target.value }))
                        }
                      />
                      <Input
                        type="month"
                        value={editForm.month}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, month: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={handleSaveEdit} loading={loading}>
                          Simpan
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" /> Memproses...
            </div>
          )}
        </CardContent>
      </Card>
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
