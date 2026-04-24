import type { CSSProperties } from "react";

interface SectionBadgeProps {
  label: string;
  pulse?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function SectionBadge({ label, pulse = true, className, style }: SectionBadgeProps) {
  return (
    <div
      style={style}
      className={`inline-flex items-center gap-3 rounded-full border border-[#84E400]/30 bg-[#84E400]/5 px-5 py-2 ${className ?? ""}`}
    >
      <span
        className={`h-2 w-2 rounded-full bg-[#84E400]${pulse ? " pulse-dot" : ""}`}
      />
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#84E400]">
        {label}
      </span>
    </div>
  );
}
