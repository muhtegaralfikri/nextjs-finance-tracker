"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Target,
  WalletCards,
} from "lucide-react";
import type { NavItem } from "./AppShell";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const iconMap = {
  dashboard: LayoutDashboard,
  wallets: WalletCards,
  transactions: ReceiptText,
  budgets: Target,
};

export default function AppShellSidebar({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();

  return (
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
          const Icon = iconMap[item.icon];
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
              <Icon className="h-5 w-5" aria-hidden />
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
  );
}
