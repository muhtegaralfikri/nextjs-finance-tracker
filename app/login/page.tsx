// src/app/login/page.tsx
"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Alert from "@/components/ui/alert";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registered = searchParams.get("registered") === "true";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (res?.error) {
      setError("Email atau password salah");
      return;
    }

    router.push(res?.url || "/dashboard");
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
          <h1 className="mt-2 text-3xl font-semibold text-white">Masuk</h1>
          <p className="text-sm text-slate-400 mt-2">
            Kelola dompet, transaksi, dan ringkasan bulanan dari satu tempat.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-emerald-900/20 p-6 space-y-4">
          {registered && (
            <Alert variant="success">Akun berhasil dibuat, silakan login.</Alert>
          )}
          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Masuk..." : "Login"}
            </Button>
          </form>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            <span>atau</span>
            <span className="h-px flex-1 bg-slate-800" />
          </div>

          <div className="space-y-2 text-center text-sm">
            <p className="text-slate-300">Belum punya akun?</p>
            <a
              href="/register"
              className="inline-flex justify-center rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-(--btn-hover-outline) hover:border-emerald-400 hover:text-white transition active:translate-y-px active:opacity-90"
            >
              Daftar sekarang
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
