"use client";

import { useState } from "react";
import { WalletType } from "@prisma/client";

export type WalletClientData = {
  id: string;
  name: string;
  type: WalletType;
  currency: string;
  initialBalance: number;
  balance: number;
};

const walletTypeOptions: Array<{ value: WalletType; label: string }> = [
  { value: WalletType.CASH, label: "Cash" },
  { value: WalletType.BANK, label: "Bank" },
  { value: WalletType.E_WALLET, label: "E-Wallet" },
  { value: WalletType.INVESTMENT, label: "Investasi" },
  { value: WalletType.OTHER, label: "Lainnya" },
];

export default function WalletsClient({
  initialWallets,
}: {
  initialWallets: WalletClientData[];
}) {
  type WalletFormState = {
    name: string;
    type: WalletType;
    currency: string;
    initialBalance: string;
  };

  const [wallets, setWallets] = useState<WalletClientData[]>(initialWallets);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<WalletFormState>({
    name: "",
    type: WalletType.CASH,
    currency: "IDR",
    initialBalance: "0",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<WalletFormState>({
    name: "",
    type: WalletType.CASH,
    currency: "IDR",
    initialBalance: "0",
  });

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  async function handleCreate() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        currency: form.currency,
        initialBalance: Number(form.initialBalance) || 0,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setMessage(data?.error || "Gagal membuat wallet");
      return;
    }

    const wallet: WalletClientData = await res.json();
    setWallets((prev) => [{ ...wallet, balance: wallet.initialBalance }, ...prev]);
    setForm({ name: "", type: WalletType.CASH, currency: "IDR", initialBalance: "0" });
    setMessage("Wallet berhasil dibuat");
  }

  function startEdit(wallet: WalletClientData) {
    setEditingId(wallet.id);
    setEditFields({
      name: wallet.name,
      type: wallet.type,
      currency: wallet.currency,
      initialBalance: String(wallet.initialBalance),
    });
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setLoading(true);
    setMessage(null);

    const res = await fetch(`/api/wallets/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editFields.name,
        type: editFields.type,
        currency: editFields.currency,
        initialBalance: Number(editFields.initialBalance) || 0,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setMessage(data?.error || "Gagal memperbarui wallet");
      return;
    }

    const updated = await res.json();
    setWallets((prev) =>
      prev.map((w) =>
        w.id === editingId
          ? {
              ...w,
              ...updated,
              balance:
                (updated.balance ?? w.balance) ||
                Number(updated.initialBalance ?? w.initialBalance),
            }
          : w
      )
    );
    setEditingId(null);
    setMessage("Wallet diperbarui");
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus wallet ini?")) return;
    setLoading(true);
    setMessage(null);

    const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setMessage(data?.error || "Gagal menghapus wallet");
      return;
    }

    setWallets((prev) => prev.filter((w) => w.id !== id));
    setMessage("Wallet dihapus");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Tambah Wallet</h2>
        {message && (
          <p className="mb-3 text-sm text-emerald-300">
            {message}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Nama</label>
            <input
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="contoh: Bank Jago"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Jenis</label>
            <select
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as WalletType }))}
            >
              {walletTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Mata uang</label>
            <input
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Saldo awal</label>
            <input
              type="number"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
              value={form.initialBalance}
              onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="mt-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2 text-sm disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Simpan"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Daftar Wallet</h2>
          <span className="text-xs text-slate-500">{wallets.length} wallet</span>
        </div>
        {wallets.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada wallet.</p>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold">{wallet.name}</p>
                    <p className="text-xs text-slate-400">
                      {wallet.type} • {wallet.currency}
                    </p>
                    <p className="text-sm text-emerald-300 mt-1">
                      Saldo: {formatCurrency(wallet.balance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(wallet)}
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(wallet.id)}
                      className="rounded-lg border border-rose-500/60 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {editingId === wallet.id && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white"
                      value={editFields.name}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                    <select
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white"
                      value={editFields.type}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, type: e.target.value as WalletType }))
                      }
                    >
                      {walletTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white"
                      value={editFields.currency}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, currency: e.target.value }))
                      }
                    />
                    <input
                      type="number"
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white"
                      value={editFields.initialBalance}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, initialBalance: e.target.value }))
                      }
                    />
                    <div className="md:col-span-2 flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2 text-sm disabled:opacity-60"
                      >
                        Simpan perubahan
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
