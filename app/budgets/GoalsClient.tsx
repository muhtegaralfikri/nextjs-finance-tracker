"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";

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
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
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
      setStatus({ type: "error", message: "Nama dan target wajib diisi" });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
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

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal membuat goal" });
        return;
      }

      const created = normalizeGoal(await res.json());
      setGoals((prev) => [created, ...prev]);
      setForm({ name: "", targetAmount: "", currentAmount: "", deadline: "", note: "" });
      setStatus({ type: "success", message: "Goal tersimpan" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
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
    try {
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

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal memperbarui goal" });
        return;
      }

      const updated = normalizeGoal(await res.json());
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setEditingId(null);
      setStatus({ type: "success", message: "Goal diperbarui" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus goal ini?")) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({ type: "error", message: data?.error || "Gagal menghapus goal" });
        return;
      }

      setGoals((prev) => prev.filter((g) => g.id !== id));
      setStatus({ type: "success", message: "Goal dihapus" });
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Goals</CardTitle>
        <CardDescription>Tetapkan target tabungan dan pantau progresnya.</CardDescription>
      </CardHeader>

      {status && (
        <Alert variant={status.type === "success" ? "success" : "error"} className="mb-3">
          {status.message}
        </Alert>
      )}

      <CardContent className="space-y-4">
        <form
          className="grid grid-cols-1 md:grid-cols-5 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <Input
            placeholder="Nama goal"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="md:col-span-2"
          />
          <Input
            type="number"
            placeholder="Target"
            value={form.targetAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Progress awal"
            value={form.currentAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, currentAmount: e.target.value }))}
          />
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
          />
          <Input
            placeholder="Catatan (opsional)"
            value={form.note}
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            className="md:col-span-4"
          />
          <Button type="submit" loading={loading} className="md:col-span-1">
            Simpan
          </Button>
        </form>

        <div className="space-y-3">
          {goals.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada goal.</p>
          ) : (
            goals.map((goal) => (
              <Card key={goal.id} className="bg-slate-950/60 border-slate-800">
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
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)} ({goal.progress}
                      %)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => startEdit(goal)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDelete(goal.id)}
                      loading={loading && editingId === goal.id}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>

                {editingId === goal.id && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
                    <Input
                      className="md:col-span-2"
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      type="number"
                      value={editForm.targetAmount}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, targetAmount: e.target.value }))
                      }
                    />
                    <Input
                      type="number"
                      value={editForm.currentAmount}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, currentAmount: e.target.value }))
                      }
                    />
                    <Input
                      type="date"
                      value={editForm.deadline}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, deadline: e.target.value }))
                      }
                    />
                    <Input
                      className="md:col-span-4"
                      value={editForm.note}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, note: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
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
            ))
          )}
        </div>

        {loading && goals.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner size="sm" /> Memproses...
          </div>
        )}
      </CardContent>
    </Card>
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
