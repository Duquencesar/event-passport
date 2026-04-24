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
        "relative overflow-hidden rounded-xl border border-border p-5",
        className
      )}
      style={{
        backgroundColor: "oklch(0.10 0.02 265)",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* Top row: icon + delta */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] shadow-[0_4px_14px_rgba(0,82,255,0.3)]">
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
      <p
        className="text-3xl text-white tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>

      {/* Label */}
      <p className="mt-1 text-xs font-mono uppercase tracking-[0.15em] text-[#94A3B8]">
        {label}
      </p>
    </div>
  );
}
