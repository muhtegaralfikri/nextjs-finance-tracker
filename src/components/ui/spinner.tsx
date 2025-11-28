"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md";
};

export default function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const dimension = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-emerald-400 border-t-transparent",
        dimension,
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}
