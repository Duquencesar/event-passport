import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;        // e.g. "+5%" or "-3%" — sign determines color
  deltaLabel?: string;   // e.g. "vs. last week"
  className?: string;
}

export function StatCard({ icon: Icon, label, value, delta, deltaLabel, className }: StatCardProps) {
  const isPositive = delta?.startsWith("+");
  const isNegative = delta?.startsWith("-");

  return (
    <div
      className={cn(
        "stat-card relative overflow-hidden rounded-xl border border-border p-5",
        className
      )}
    >
      {/* Top row: icon + delta */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/40 to-secondary shadow-[var(--shadow-accent)]">
          <Icon className="h-5 w-5 text-white" />
        </div>
        {delta && (
          <span
            className={cn(
              "text-xs font-mono font-medium",
              isPositive && "text-emerald-400",
              isNegative && "text-red-400",
              !isPositive && !isNegative && "text-muted-foreground"
            )}
            title={deltaLabel}
          >
            {isPositive ? "▲" : isNegative ? "▼" : ""} {delta}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="font-display text-3xl text-foreground tabular-nums">
        {value}
      </p>

      {/* Label */}
      <p className="caption mt-1">{label}</p>
    </div>
  );
}
