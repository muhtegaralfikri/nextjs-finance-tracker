"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import type { NavItem } from "./AppShell";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShellHeader({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeLabel =
    navItems.find((item) => isActive(pathname, item.href))?.label || "Finance";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-900/80 bg-slate-950/80 backdrop-blur">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold lg:hidden">
            FT
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Personal Finance
            </p>
            <p className="text-base font-semibold text-white">{activeLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/transactions"
            prefetch
            onMouseEnter={() => router.prefetch("/transactions")}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 transition"
          >
            <span aria-hidden>＋</span>
            <span>Tambah transaksi</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
