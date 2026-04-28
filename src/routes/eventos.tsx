import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Users,
  UserCheck,
  TrendingUp,
  CalendarClock,
  History,
  Download,
  RefreshCw,
} from "lucide-react";
import { getAllEventsWithStats, getEventCheckedInParticipantsForExport } from "@/server/event.functions";
import { getLastLumaSync, triggerLumaSync } from "@/server/luma-status.functions";
import { getCurrentBrasiliaDateKeySync } from "@/lib/brasilia-time";
import { SectionBadge } from "@/components/SectionBadge";
import { toast } from "sonner";

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
      className={`glass lift-glow rounded-2xl p-5 space-y-4 ${isPast && !isToday ? "opacity-70 hover:opacity-100" : ""} ${isToday ? "border-primary/30" : ""}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isToday && (
              <Badge className="bg-primary/12 text-primary border-0 rounded-lg text-xs flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-ring" />
                Hoje
              </Badge>
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
            className="text-muted-foreground hover:text-primary tap-pop p-1.5 rounded-lg hover:bg-primary/10"
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
              className="text-muted-foreground hover:text-primary tap-pop p-1.5 rounded-lg hover:bg-primary/10"
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
  onExport,
}: {
  date: string;
  events: EventWithStats[];
  today: string;
  onExport: (event: EventWithStats) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground capitalize flex items-center gap-2">
        <CalendarDays className="w-4 h-4" />
        {formatDate(date)}
      </h3>
      <div className="space-y-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} today={today} onExport={onExport} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#0884c7] to-[#29B6F6] mx-auto mb-4 shadow-[0_4px_14px_rgba(41,182,246,0.3)]">
        <Calendar className="h-7 w-7 text-white" />
      </div>
      <p className="text-sm font-medium text-foreground">Nenhum evento encontrado</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "nunca";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return "agora";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "há instantes";
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d !== 1 ? "s" : ""}`;
}

function EventosPage() {
  const [allEvents, setAllEvents] = useState<EventWithStats[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [, forceTick] = useState(0);
  const today = getCurrentBrasiliaDateKeySync();

  const loadEvents = useCallback(async () => {
    try {
      const e = await getAllEventsWithStats();
      setAllEvents(e as EventWithStats[]);
      setLoaded(true);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar eventos");
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    getLastLumaSync().then((r) => setLastSync(r.last_sync)).catch(() => {});
  }, [loadEvents]);

  // Keep relative times fresh
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerLumaSync();
      const t = result.totals;
      toast.success("Sincronização concluída", {
        description: `${result.events_processed} eventos · ${t.registrations} inscritos · ${t.checkins} check-ins`,
      });
      await Promise.all([loadEvents(), getLastLumaSync().then((r) => setLastSync(r.last_sync))]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao sincronizar";
      toast.error("Erro na sincronização", { description: msg });
    } finally {
      setSyncing(false);
    }
  };

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

  const syncStale = !lastSync || (Date.now() - new Date(lastSync).getTime()) > 4 * 3600 * 1000;

  return (
    <Layout>
      <div className="space-y-8 fade-up stagger">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <SectionBadge label="EVENTOS LUMA" pulse={false} className="mb-3" />
            <h1 className="mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: '1.1' }}>
              <span className="gradient-text">Eventos</span>
            </h1>
            <p className="text-muted-foreground text-sm">Calendário Ipê Village {new Date().getFullYear()}</p>
          </div>
          {loaded && allEvents.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-border bg-card px-4 py-2.5 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-bold">{allEvents.length}</span>
                <span className="text-xs text-muted-foreground">eventos</span>
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-2.5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#84E400]" />
                <span className="text-lg font-bold text-[#84E400]">{totalCheckins}</span>
                <span className="text-xs text-muted-foreground">check-ins</span>
              </div>
            </div>
          )}
        </div>

        {/* Luma sync status bar */}
        <div
          className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 flex-wrap lift-glow group"
          role="status"
          aria-label={`Status de sincronização com Luma: ${lastSync ? `sincronizado ${formatRelativeTime(lastSync)}` : "nunca sincronizado"}`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                syncing
                  ? "bg-[#84E400] animate-pulse"
                  : syncStale
                    ? "bg-amber-400 animate-pulse"
                    : "bg-emerald-400"
              }`}
            />
            <div>
              <span className="text-sm text-muted-foreground">
                {syncing
                  ? "Sincronizando..."
                  : lastSync
                    ? `Sincronizado ${formatRelativeTime(lastSync)}`
                    : "Nunca sincronizado"}
              </span>
              {lastSync && !syncing && (
                <span className="text-xs text-muted-foreground/60 ml-2 font-mono">
                  {new Date(lastSync).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            className="h-9 px-4 rounded-xl gap-2 tap-pop"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : "icon-spin-hover"}`} />
            {syncing ? "Sincronizando..." : "Sincronizar agora"}
          </Button>
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
            <TabsList className="glass rounded-xl p-1 h-auto gap-1 flex-wrap">
              {todayEvents.length > 0 && (
                <TabsTrigger value="hoje" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-[#84E400] data-[state=active]:bg-[#84E400]/10 gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#84E400] inline-block" />
                  Hoje ({todayEvents.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="proximos" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-[#84E400] data-[state=active]:bg-[#84E400]/10 gap-2">
                <CalendarClock className="w-3.5 h-3.5" />
                Próximos ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="passados" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-[#84E400] data-[state=active]:bg-[#84E400]/10 gap-2">
                <History className="w-3.5 h-3.5" />
                Passados ({pastEvents.length})
              </TabsTrigger>
              <TabsTrigger value="todos" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-[#84E400] data-[state=active]:bg-[#84E400]/10">
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
                  <DateGroup key={date} date={date} events={events} today={today} onExport={handleExportEventCheckins} />
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
                    <DateGroup key={date} date={date} events={events} today={today} onExport={handleExportEventCheckins} />
                  ))}
                </>
              )}
            </TabsContent>

            {/* Todos */}
            <TabsContent value="todos" className="mt-6 space-y-8">
              {Object.entries(groupByDate(allEvents)).map(([date, events]) => (
                <DateGroup key={date} date={date} events={events} today={today} onExport={handleExportEventCheckins} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
