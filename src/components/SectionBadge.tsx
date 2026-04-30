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
      className={`inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 ${className ?? ""}`}
    >
      <span
        className={`h-2 w-2 rounded-full bg-primary${pulse ? " pulse-dot" : ""}`}
      />
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-primary">
        {label}
      </span>
    </div>
  );
}
