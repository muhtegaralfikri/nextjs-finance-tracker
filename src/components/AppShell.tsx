import { ReactNode } from "react";
import AppShellHeader from "./AppShellHeader";
import AppShellSidebar from "./AppShellSidebar";
import AppShellBottomNav from "./AppShellBottomNav";

export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "wallets" | "transactions" | "budgets";
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/wallets", label: "Wallets", icon: "wallets" },
  { href: "/transactions", label: "Transaksi", icon: "transactions" },
  { href: "/budgets", label: "Budget", icon: "budgets" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <div className="flex min-h-screen">
        <AppShellSidebar navItems={navItems} />
        <div className="flex-1 flex flex-col min-h-screen">
          <AppShellHeader navItems={navItems} />
          <main className="flex-1 pb-32 lg:pb-10">{children}</main>
          <footer className="px-4 pb-4 text-xs text-slate-500 text-center mb-16 lg:mb-0">
            © {year} Finance Tracker
          </footer>
        </div>
      </div>
      <AppShellBottomNav navItems={navItems} />
    </div>
  );
}
