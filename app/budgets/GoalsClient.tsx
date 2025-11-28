"use client";

import { useState } from "react";

export type GoalItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  deadline?: string | null;
  note?: string | null;
};

export default function GoalsClient({ initialGoals }: { initialGoals: GoalItem[] }) {
  const [goals, setGoals] = useState<GoalItem[]>(initialGoals);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    note: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    note: "",
  });

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  async function handleCreate() {
    if (!form.name || !form.targetAmount) {
      setStatus("Nama dan target wajib diisi");
      return;
    }
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        targetAmount: Number(form.targetAmount),
        currentAmount: form.currentAmount ? Number(form.currentAmount) : 0,
        deadline: form.deadline || undefined,
        note: form.note || undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal membuat goal");
      return;
    }

    const created = normalizeGoal(await res.json());
    setGoals((prev) => [created, ...prev]);
    setForm({ name: "", targetAmount: "", currentAmount: "", deadline: "", note: "" });
    setStatus("Goal tersimpan");
  }

  function startEdit(goal: GoalItem) {
    setEditingId(goal.id);
    setEditForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      deadline: goal.deadline ? goal.deadline.slice(0, 10) : "",
      note: goal.note || "",
    });
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setLoading(true);
    setStatus(null);
    const res = await fetch(`/api/goals/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        targetAmount: editForm.targetAmount ? Number(editForm.targetAmount) : undefined,
        currentAmount: editForm.currentAmount ? Number(editForm.currentAmount) : undefined,
        deadline: editForm.deadline || null,
        note: editForm.note,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal memperbarui goal");
      return;
    }

    const updated = normalizeGoal(await res.json());
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setEditingId(null);
    setStatus("Goal diperbarui");
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus goal ini?")) return;
    setLoading(true);
    setStatus(null);
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus(data?.error || "Gagal menghapus goal");
      return;
    }

    setGoals((prev) => prev.filter((g) => g.id !== id));
    setStatus("Goal dihapus");
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Savings Goals</h2>
        <p className="text-sm text-slate-400">
          Tetapkan target tabungan dan pantau progresnya.
        </p>
      </div>
      {status && <p className="text-sm text-emerald-300">{status}</p>}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white md:col-span-2"
          placeholder="Nama goal"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="number"
          className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
          placeholder="Target"
          value={form.targetAmount}
          onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
        />
        <input
          type="number"
          className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
          placeholder="Progress awal"
          value={form.currentAmount}
          onChange={(e) => setForm((prev) => ({ ...prev, currentAmount: e.target.value }))}
        />
        <input
          type="date"
          className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
          value={form.deadline}
          onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
        />
        <input
          className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white md:col-span-4"
          placeholder="Catatan (opsional)"
          value={form.note}
          onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
        />
        <button
          onClick={handleCreate}
          disabled={loading}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2 text-sm disabled:opacity-60 md:col-span-1"
        >
          Simpan
        </button>
      </div>

      <div className="space-y-3">
        {goals.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada goal.</p>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-white">{goal.name}</p>
                  {goal.deadline && (
                    <p className="text-xs text-slate-400">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  )}
                  {goal.note && <p className="text-xs text-slate-400 mt-1">{goal.note}</p>}
                  <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)} ({goal.progress}%)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(goal)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="rounded-lg border border-rose-500/60 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {editingId === goal.id && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input
                    className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white md:col-span-2"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white"
                    value={editForm.targetAmount}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, targetAmount: e.target.value }))
                    }
                  />
                  <input
                    type="number"
                    className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white"
                    value={editForm.currentAmount}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, currentAmount: e.target.value }))
                    }
                  />
                  <input
                    type="date"
                    className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white"
                    value={editForm.deadline}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, deadline: e.target.value }))
                    }
                  />
                  <input
                    className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white md:col-span-4"
                    value={editForm.note}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, note: e.target.value }))}
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
          ))
        )}
      </div>
    </div>
  );
}

type ApiGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  deadline?: string | null;
  note?: string | null;
};

function normalizeGoal(goal: ApiGoal): GoalItem {
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    progress: Number(goal.progress || 0),
    deadline: goal.deadline || null,
    note: goal.note || null,
  };
}
