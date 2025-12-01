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

export default function AppShellBottomNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = iconMap[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors ${
                active
                  ? "text-emerald-300"
                  : "text-slate-400 hover:text-emerald-200 active:text-emerald-200"
              }`}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
