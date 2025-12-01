"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";
import Spinner from "./spinner";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "md" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-500 text-slate-950 hover:bg-emerald-600 hover:shadow-emerald-500/30 hover:shadow-lg shadow-lg shadow-emerald-500/20",
  outline:
    "border border-slate-700 text-slate-100 bg-slate-950/40 hover:border-emerald-400 hover:bg-[var(--btn-hover-outline)] hover:text-white hover:shadow-[0_0_0_1px_rgba(16,185,129,0.35)]",
  ghost: "text-slate-100 hover:bg-[var(--btn-hover-ghost)] hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]",
  danger:
    "border border-rose-500/60 text-rose-200 bg-slate-950/40 hover:bg-[var(--btn-hover-danger)] hover:border-rose-400 hover:text-white hover:shadow-[0_0_0_1px_rgba(248,113,113,0.35)]",
};

const sizeClass: Record<ButtonSize, string> = {
  md: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className, variant = "primary", size = "md", loading, disabled, type, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-150 disabled:opacity-60 hover:-translate-y-px",
        sizeClass[size],
        variantClass[variant],
        className
      )}
      disabled={disabled || loading}
      type={type ?? "button"}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
});

export default Button;
