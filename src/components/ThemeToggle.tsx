"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/cn";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "rounded-xl border border-slate-800 px-3 py-2 text-slate-300 hover:border-emerald-400/60 transition",
        className,
      )}
      aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-white" aria-hidden />
      ) : (
        <Moon className="h-5 w-5 text-slate-900" aria-hidden />
      )}
    </button>
  );
}
