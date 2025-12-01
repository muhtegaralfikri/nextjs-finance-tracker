import { cn } from "@/lib/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-slate-800/60",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        className
      )}
    />
  );
}
