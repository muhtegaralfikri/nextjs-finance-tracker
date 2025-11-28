"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/wallets", label: "Wallets", icon: "👛" },
  { href: "/transactions", label: "Transaksi", icon: "🧾" },
  { href: "/budgets", label: "Budget", icon: "🎯" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeLabel =
    navItems.find((item) => isActive(pathname, item.href))?.label || "Finance";
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("theme");
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", next);
    }
    document.documentElement.dataset.theme = next;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-900/80 bg-slate-950/90 backdrop-blur sticky top-0 h-screen">
          <Link href="/dashboard" className="px-5 py-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold">
              FT
            </div>
            <div>
              <p className="text-sm text-slate-400">Finance</p>
              <p className="text-lg font-semibold text-white">Tracker</p>
            </div>
          </Link>

          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition border border-transparent ${
                    active
                      ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                      : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <span className="text-lg" aria-hidden>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-4 py-4 text-xs text-slate-500 border-t border-slate-900/80">
            <p className="font-semibold text-slate-300">Hybrid Nav</p>
            <p>Sidebar untuk layar besar, bottom bar untuk mobile.</p>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 border-b border-slate-900/80 bg-slate-950/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold lg:hidden">
                  FT
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">
                    Personal Finance
                  </p>
                  <p className="text-base font-semibold text-white">{activeLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="/transactions"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 transition"
                >
                  <span aria-hidden>＋</span>
                  <span>Tambah transaksi</span>
                </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-800 px-3 py-2 text-slate-300 hover:border-emerald-400/60"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl border border-slate-800 px-3 py-2 text-slate-300 hover:border-emerald-400/60 transition"
              >
                {theme === "dark" ? "Mode terang" : "Mode gelap"}
              </button>
            </div>
          </div>
        </header>

          <main className="flex-1 pb-24 lg:pb-10">{children}</main>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-xs ${
                  active ? "text-emerald-300" : "text-slate-400 hover:text-slate-200"
                }`}
                aria-label={item.label}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
