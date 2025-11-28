"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none transition",
        className
      )}
      {...props}
    />
  );
});

export default Input;
