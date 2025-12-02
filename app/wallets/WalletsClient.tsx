"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { WalletType, WalletTypeLabels } from "@/lib/financeTypes";
import { formatCurrency } from "@/lib/currency";

export type WalletClientData = {
  id: string;
  name: string;
  type: WalletType;
  currency: string;
  initialBalance: number;
  balance: number;
};

const walletTypeOptions: Array<{ value: WalletType; label: string }> = [
  { value: WalletType.CASH, label: WalletTypeLabels.CASH },
  { value: WalletType.BANK, label: WalletTypeLabels.BANK },
  { value: WalletType.E_WALLET, label: WalletTypeLabels.E_WALLET },
  { value: WalletType.INVESTMENT, label: WalletTypeLabels.INVESTMENT },
  { value: WalletType.OTHER, label: WalletTypeLabels.OTHER },
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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
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

  async function handleCreate() {
    if (!form.name.trim()) {
      setFeedback({ type: "error", message: "Nama wallet wajib diisi" });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
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

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setFeedback({ type: "error", message: data?.error || "Gagal membuat wallet" });
        return;
      }

      const wallet: WalletClientData = await res.json();
      setWallets((prev) => [{ ...wallet, balance: wallet.initialBalance }, ...prev]);
      setForm({ name: "", type: WalletType.CASH, currency: "IDR", initialBalance: "0" });
      setFeedback({ type: "success", message: "Wallet berhasil dibuat" });
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
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
    setFeedback(null);

    try {
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

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setFeedback({ type: "error", message: data?.error || "Gagal memperbarui wallet" });
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
      setFeedback({ type: "success", message: "Wallet diperbarui" });
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus wallet ini?")) return;
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setFeedback({ type: "error", message: data?.error || "Gagal menghapus wallet" });
        return;
      }

      setWallets((prev) => prev.filter((w) => w.id !== id));
      setFeedback({ type: "success", message: "Wallet dihapus" });
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>Tambah Wallet</CardTitle>
          <CardDescription>
            Kelola semua dompet (cash, bank, e-wallet) dengan saldo awal yang jelas.
          </CardDescription>
        </CardHeader>

        {feedback && (
          <Alert
            variant={feedback.type === "success" ? "success" : "error"}
            className="mb-3"
          >
            {feedback.message}
          </Alert>
        )}

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Nama</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="contoh: Bank Jago"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Jenis</label>
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as WalletType }))}
            >
              {walletTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Mata uang</label>
            <Input
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Saldo awal</label>
            <Input
              type="number"
              value={form.initialBalance}
              onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={loading}>
              Simpan Wallet
            </Button>
          </div>
        </form>
      </Card>

      <Card aria-busy={loading}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
          <div>
            <CardTitle>Daftar Wallet</CardTitle>
            <CardDescription>Saldo selalu terbarui dari transaksi terakhir.</CardDescription>
          </div>
          <span className="text-xs text-slate-500">{wallets.length} wallet</span>
        </div>
        {wallets.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada wallet.</p>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <Card key={wallet.id} className="bg-slate-950/60 border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold">{wallet.name}</p>
                    <p className="text-xs text-slate-400">
                      {WalletTypeLabels[wallet.type] || wallet.type} • {wallet.currency}
                    </p>
                    <p className="text-sm text-emerald-300 mt-1">
                      Saldo: {formatCurrency(wallet.balance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => startEdit(wallet)}
                      className="px-3 py-1"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDelete(wallet.id)}
                      className="px-3 py-1"
                      loading={loading && editingId === wallet.id}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>

                {editingId === wallet.id && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      value={editFields.name}
                      onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                    />
                    <Select
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
                    </Select>
                    <Input
                      value={editFields.currency}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, currency: e.target.value }))
                      }
                    />
                    <Input
                      type="number"
                      value={editFields.initialBalance}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, initialBalance: e.target.value }))
                      }
                    />
                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      <Button type="button" onClick={handleSaveEdit} loading={loading}>
                        Simpan perubahan
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
        {loading && wallets.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <Spinner size="sm" /> Memproses aksi...
          </div>
        )}
      </Card>
    </div>
  );
}
