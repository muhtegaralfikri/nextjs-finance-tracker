// src/app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
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
    });

    setLoading(false);

    if (res?.error) {
      setError("Email atau password salah");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Finance Tracker Login
        </h1>

        {registered && (
          <p className="text-sm text-emerald-400 mb-3">
            Akun berhasil dibuat, silakan login.
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400 mb-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold py-2 text-sm disabled:opacity-60"
          >
            {loading ? "Masuk..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          Belum punya akun?{" "}
          <a href="/register" className="text-emerald-400 hover:underline">
            Daftar di sini
          </a>
        </p>
      </div>
    </div>
  );
}
