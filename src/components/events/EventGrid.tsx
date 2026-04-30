import { Badge } from "@/components/ui/badge";
import { SectionBadge } from "@/components/SectionBadge";
import { Clock, MapPin, ChevronRight } from "lucide-react";

export type EventCardData = {
  id: string;
  name: string;
  date: string;
  time: string | null;
  organizer: string | null;
  location: string | null;
  registration_count: number;
  checkin_count: number;
};

type Variant = "active" | "upcoming";

function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "short",
  }).format(dt);
}

function EventCard({
  event,
  variant,
  onSelect,
}: {
  event: EventCardData;
  variant: Variant;
  onSelect: (event: EventCardData) => void;
}) {
  const pct =
    event.registration_count > 0
      ? Math.min(100, Math.round((event.checkin_count / event.registration_count) * 100))
      : 0;

  // Pri 1: nome + barra de progresso. Pri 2: hora. Pri 3: local (tooltip-like, truncado).
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={`group relative w-full overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-accent)] ${
        variant === "upcoming" ? "opacity-85 hover:opacity-100" : ""
      }`}
      aria-label={`${event.name}, ${event.checkin_count} de ${event.registration_count} check-ins, ${pct}%`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="relative space-y-3">
        {/* Top row: status badge + chevron */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              {variant === "active" ? (
                <SectionBadge label="ATIVO" pulse className="px-2 py-0.5 text-[10px]" />
              ) : (
                <Badge className="rounded-lg border-0 bg-secondary/12 px-2 py-0.5 text-[10px] text-secondary">
                  {formatShortDate(event.date)}
                </Badge>
              )}
              {event.time && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {event.time}
                </span>
              )}
            </div>
            <h4 className="line-clamp-2 font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {event.name}
            </h4>
          </div>
          <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
        </div>

        {/* Local — secundário, único */}
        {event.location && (
          <div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Stats consolidados em um único bloco numérico */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {event.checkin_count}
              <span className="text-muted-foreground">/{event.registration_count}</span>
              <span className="ml-1 text-xs font-normal text-muted-foreground">presentes</span>
            </span>
            {event.registration_count > 0 && (
              <span
                className={`text-xs font-semibold tabular-nums ${
                  pct >= 75 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-muted-foreground"
                }`}
              >
                {pct}%
              </span>
            )}
          </div>
          {event.registration_count > 0 && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-border/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  variant === "active" ? "bg-primary/80" : "bg-secondary/60"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function EventGrid({
  title,
  events,
  variant,
  onSelect,
}: {
  title: string;
  events: EventCardData[];
  variant: Variant;
  onSelect: (event: EventCardData) => void;
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} variant={variant} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}