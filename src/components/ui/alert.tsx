"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type AlertVariant = "info" | "success" | "error";

const variantClass: Record<AlertVariant, string> = {
  info: "bg-slate-800/80 text-slate-100 border-slate-700",
  success: "bg-emerald-500/10 text-emerald-200 border-emerald-400/50",
  error: "bg-rose-500/10 text-rose-200 border-rose-400/60",
};

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

export default function Alert({ className, variant = "info", ...props }: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-sm transition-colors",
        variantClass[variant],
        className
      )}
      role="status"
      {...props}
    />
  );
}
