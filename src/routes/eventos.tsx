import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Clock,
  MapPin,
  ExternalLink,
  Users,
  UserCheck,
  TrendingUp,
  CalendarClock,
  History,
  Download,
} from "lucide-react";
import { getAllEventsWithStats, getEventCheckedInParticipantsForExport } from "@/server/event.functions";
import { getCurrentBrasiliaDateKeySync } from "@/lib/brasilia-time";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — Ipê Village Check-In" },
      { name: "description", content: "Calendário de eventos do Ipê Village" },
    ],
  }),
  component: EventosPage,
});

type EventWithStats = {
  id: string;
  name: string;
  date: string;
  time: string | null;
  organizer: string | null;
  location: string | null;
  url: string | null;
  registration_count: number;
  checkin_count: number;
};

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const APP_TIME_ZONE = "America/Sao_Paulo";

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function daysFromToday(dateKey: string, today: string): number {
  const [ty, tm, td] = today.split("-").map(Number);
  const [ey, em, ed] = dateKey.split("-").map(Number);
  const t = Date.UTC(ty, tm - 1, td);
  const e = Date.UTC(ey, em - 1, ed);
  return Math.round((e - t) / 86_400_000);
}

function AttendancePill({ checkins, registrations }: { checkins: number; registrations: number }) {
  const pct = registrations > 0 ? Math.min(100, Math.round((checkins / registrations) * 100)) : 0;
  const color =
    pct >= 75 ? "text-emerald-400 bg-emerald-500/10" :
    pct >= 40 ? "text-amber-400 bg-amber-500/10" :
    "text-muted-foreground bg-muted/30";
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
      {checkins}/{registrations} ({pct}%)
    </span>
  );
}

function EventCard({
  event,
  today,
  showStats = true,
  onExport,
}: {
  event: EventWithStats;
  today: string;
  showStats?: boolean;
  onExport: (event: EventWithStats) => void;
}) {
  const isToday = event.date === today;
  const isPast = event.date < today;
  const days = daysFromToday(event.date, today);
  const pct =
    event.registration_count > 0
      ? Math.min(100, Math.round((event.checkin_count / event.registration_count) * 100))
      : 0;

  return (
    <div
      className={`glass rounded-2xl p-5 space-y-4 transition-opacity ${isPast && !isToday ? "opacity-70 hover:opacity-90" : ""}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isToday && (
              <Badge className="bg-primary/12 text-primary border-0 rounded-lg text-xs">Hoje</Badge>
            )}
            {isPast && !isToday && (
              <Badge variant="secondary" className="text-xs rounded-lg opacity-70">Passado</Badge>
            )}
            {!isPast && !isToday && days === 1 && (
              <Badge className="bg-amber-500/15 text-amber-400 border-0 rounded-lg text-xs">Amanhã</Badge>
            )}
            {!isPast && !isToday && days > 1 && (
              <Badge className="bg-sky-500/15 text-sky-400 border-0 rounded-lg text-xs">em {days} dias</Badge>
            )}
          </div>
          <h4 className="font-bold text-foreground leading-tight">{event.name}</h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onExport(event)}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
            title="Baixar check-ins"
          >
            <Download className="w-4 h-4" />
          </button>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary transition-colors p-1"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        {event.time && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {event.time}
          </span>
        )}
        {event.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {event.location}
          </span>
        )}
        {event.organizer && (
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 shrink-0" />
            {event.organizer}
          </span>
        )}
      </div>

      {/* Stats */}
      {showStats && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <strong className="text-foreground">{event.registration_count}</strong> inscritos
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <UserCheck className="w-3.5 h-3.5" />
                <strong className="text-primary">{event.checkin_count}</strong> check-ins
              </span>
            </div>
            {event.registration_count > 0 && (
              <AttendancePill checkins={event.checkin_count} registrations={event.registration_count} />
            )}
          </div>
          {event.registration_count > 0 && (
            <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isPast ? "bg-muted-foreground/40" : "bg-primary/70"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DateGroup({
  date,
  events,
  today,
}: {
  date: string;
  events: EventWithStats[];
  today: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground capitalize flex items-center gap-2">
        <CalendarDays className="w-4 h-4" />
        {formatDate(date)}
      </h3>
      <div className="space-y-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} today={today} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass rounded-3xl py-16 text-center">
      <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

function EventosPage() {
  const [allEvents, setAllEvents] = useState<EventWithStats[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = getCurrentBrasiliaDateKeySync();

  useEffect(() => {
    getAllEventsWithStats()
      .then((e) => { setAllEvents(e as EventWithStats[]); setLoaded(true); })
      .catch((err) => { setError(err?.message || "Erro ao carregar eventos"); setLoaded(true); });
  }, []);

  const todayEvents = allEvents.filter((e) => e.date === today);
  const upcomingEvents = allEvents.filter((e) => e.date > today);
  const pastEvents = [...allEvents.filter((e) => e.date < today)].reverse(); // most recent first

  // Group by date
  function groupByDate(events: EventWithStats[]) {
    const map: Record<string, EventWithStats[]> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }

  const upcomingByDate = groupByDate(upcomingEvents);
  const pastByDate = groupByDate(pastEvents);

  // Summary stats
  const totalCheckins = allEvents.reduce((s, e) => s + e.checkin_count, 0);
  const totalRegistrations = allEvents.reduce((s, e) => s + (e.registration_count || 0), 0);

  const handleExportEventCheckins = async (event: EventWithStats) => {
    const rows = await getEventCheckedInParticipantsForExport({ data: { event_id: event.id } });
    const header = ["nome", "categoria", "acesso", "periodo", "checkin_em", "origem"];
    const csv = [header.join(","), ...rows.map((row) => header.map((key) => csvCell(row[key as keyof typeof row])).join(","))].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.date}-${event.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-checkins.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
            <p className="text-muted-foreground text-sm mt-1">Calendário Ipê Village {new Date().getFullYear()}</p>
          </div>
          {loaded && allEvents.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="glass-subtle rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-bold">{allEvents.length}</span>
                <span className="text-xs text-muted-foreground">eventos</span>
              </div>
              <div className="glass-subtle rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold text-primary">{totalCheckins}</span>
                <span className="text-xs text-muted-foreground">check-ins</span>
              </div>
            </div>
          )}
        </div>

        {!loaded && (
          <div className="glass rounded-3xl py-16 text-center">
            <p className="text-muted-foreground text-sm">Carregando eventos...</p>
          </div>
        )}

        {error && (
          <div className="glass rounded-2xl px-5 py-4 border border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loaded && !error && allEvents.length === 0 && (
          <EmptyState label="Nenhum evento cadastrado" />
        )}

        {loaded && allEvents.length > 0 && (
          <Tabs defaultValue={todayEvents.length > 0 ? "hoje" : upcomingEvents.length > 0 ? "proximos" : "passados"}>
            <TabsList className="rounded-2xl bg-muted/40 p-1 h-auto gap-1 flex-wrap">
              {todayEvents.length > 0 && (
                <TabsTrigger value="hoje" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Hoje ({todayEvents.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="proximos" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                <CalendarClock className="w-3.5 h-3.5" />
                Próximos ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="passados" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                <History className="w-3.5 h-3.5" />
                Passados ({pastEvents.length})
              </TabsTrigger>
              <TabsTrigger value="todos" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Todos ({allEvents.length})
              </TabsTrigger>
            </TabsList>

            {/* Hoje */}
            {todayEvents.length > 0 && (
              <TabsContent value="hoje" className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                    Acontecendo hoje
                  </span>
                </div>
                {todayEvents.map((event) => (
                  <EventCard key={event.id} event={event} today={today} onExport={handleExportEventCheckins} />
                ))}
              </TabsContent>
            )}

            {/* Próximos */}
            <TabsContent value="proximos" className="mt-6 space-y-8">
              {upcomingEvents.length === 0 ? (
                <EmptyState label="Nenhum evento futuro agendado" />
              ) : (
                Object.entries(upcomingByDate).map(([date, events]) => (
                  <DateGroup key={date} date={date} events={events} today={today} />
                ))
              )}
            </TabsContent>

            {/* Passados */}
            <TabsContent value="passados" className="mt-6 space-y-8">
              {pastEvents.length === 0 ? (
                <EmptyState label="Nenhum evento passado" />
              ) : (
                <>
                  {/* Summary card */}
                  <div className="glass rounded-2xl px-5 py-4 flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{pastEvents.length} eventos realizados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        <strong className="text-primary">{pastEvents.reduce((s, e) => s + e.checkin_count, 0)}</strong>
                        <span className="text-muted-foreground"> check-ins no total</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-secondary" />
                      <span className="text-sm text-muted-foreground">
                        Média:{" "}
                        <strong>
                          {pastEvents.length > 0
                            ? Math.round(pastEvents.reduce((s, e) => s + e.checkin_count, 0) / pastEvents.length)
                            : 0}
                        </strong>{" "}
                        por evento
                      </span>
                    </div>
                  </div>
                  {Object.entries(pastByDate).map(([date, events]) => (
                    <DateGroup key={date} date={date} events={events} today={today} />
                  ))}
                </>
              )}
            </TabsContent>

            {/* Todos */}
            <TabsContent value="todos" className="mt-6 space-y-8">
              {Object.entries(groupByDate(allEvents)).map(([date, events]) => (
                <DateGroup key={date} date={date} events={events} today={today} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
