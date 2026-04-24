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
      className={`inline-flex items-center gap-3 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 px-5 py-2 ${className ?? ""}`}
    >
      <span
        className={`h-2 w-2 rounded-full bg-[#0052FF]${pulse ? " pulse-dot" : ""}`}
      />
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#0052FF]">
        {label}
      </span>
    </div>
  );
}
