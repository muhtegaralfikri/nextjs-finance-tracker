"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none transition",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
