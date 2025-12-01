// src/app/register/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Alert from "@/components/ui/alert";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Gagal register");
      return;
    }

    // Setelah register, redirect ke login dengan flag query
    router.push("/login?registered=true");
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Personal Finance Tracker
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Daftar Akun</h1>
          <p className="text-sm text-slate-400 mt-2">
            Mulai catat dompet, transaksi, dan ringkasan bulanan dalam hitungan menit.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-emerald-900/20 p-6 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Nama</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-300">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-300">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Mendaftar..." : "Daftar"}
            </Button>
          </form>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            <span>atau</span>
            <span className="h-px flex-1 bg-slate-800" />
          </div>

          <div className="space-y-2 text-center text-sm">
            <p className="text-slate-300">Sudah punya akun?</p>
            <a
              href="/login"
              className="inline-flex justify-center rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-(--btn-hover-outline) hover:border-emerald-400 hover:text-white transition active:translate-y-px active:opacity-90"
            >
              Login di sini
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
