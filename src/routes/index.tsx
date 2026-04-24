import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatBrasiliaTime, getCurrentBrasiliaDateKeySync } from "@/lib/brasilia-time";
import {
  Search,
  UserCheck,
  Clock,
  CheckCircle2,
  CalendarDays,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Users,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  Pencil,
  X,
  Check,
  Download,
} from "lucide-react";
import {
  searchPeople,
  searchPeopleForEvent,
  createCheckin,
  getEventCheckins,
  getTodayCheckins,
  getTodayCheckinsForExport,
  getTodayCount,
  deleteCheckin,
  updateCheckin,
  getPersonRegistrations,
  checkDuplicateCheckin,
} from "@/server/checkin.functions";
import { getTodayEventsWithStats, getEventCheckinCount, getEventRegistrationCount, getNextUpcomingEvents, getEventCheckedInParticipantsForExport, getEventParticipants } from "@/server/event.functions";
import { getLastLumaSync, triggerLumaSync } from "@/server/luma-status.functions";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ipê Village - Check-In" },
      { name: "description", content: "Sistema de check-in para Ipê Village" },
    ],
  }),
  component: CheckinPage,
});

type Person = { id: string; name: string; tag: string | null; registered?: boolean };
type EventBase = { id: string; name: string; date: string; time: string | null; organizer: string | null; location: string | null };
type EventWithStats = EventBase & { registration_count: number; checkin_count: number };
type Registration = { id: string; event_name: string; ticket_type: string; day_pass_date: string | null; week_pass_start_date: string | null; event_id: string | null };
type EventParticipant = { id: string; name: string; tag: string | null; ticket_type: string; access_type: string };

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

type ExportFormat = "csv" | "xlsx";
type ExportRow = Record<string, unknown>;

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function downloadRows(rows: ExportRow[], header: string[], filename: string, format: ExportFormat) {
  if (format === "csv") {
    const csv = [header.join(","), ...rows.map((row) => header.map((key) => csvCell(row[key])).join(","))].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows, { header });
  worksheet["!cols"] = header.map((key) => ({ wch: Math.max(14, key.length + 4) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Check-ins");
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

type AccessWarning = {
  type: "ok" | "warning" | "danger";
  message: string;
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "nunca";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return "agora";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "há instantes";
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d !== 1 ? "s" : ""}`;
}

function checkAccess(
  registrations: Registration[],
  selectedEvent: EventBase | null,
  eventDate?: string,
): AccessWarning {
  if (!registrations.length) {
    return { type: "danger", message: "Sem inscrição encontrada" };
  }

  const ticketTypes = registrations.map((r) => r.ticket_type.toLowerCase());

  const hasFullAccess = ticketTypes.some(
    (t) => t.includes("architect") || t.includes("explorer")
  );
  if (hasFullAccess) {
    const accessType = ticketTypes.find((t) => t.includes("architect"))
      ? "Architect"
      : "Explorer";
    return { type: "ok", message: `Acesso total (${accessType})` };
  }

  const today = eventDate || getCurrentBrasiliaDateKeySync();

  // Day Pass: válido apenas no dia exato
  const dayPasses = registrations.filter((r) =>
    r.ticket_type.toLowerCase().includes("day pass") || r.ticket_type.toLowerCase().includes("day-pass")
  );
  if (dayPasses.length > 0) {
    const hasValidDayPass = dayPasses.some((dp) => dp.day_pass_date === today);
    if (hasValidDayPass) {
      return { type: "ok", message: "Day Pass válido para hoje" };
    }
    const dates = dayPasses.map((dp) => dp.day_pass_date).filter(Boolean);
    if (dates.length > 0) {
      return {
        type: "warning",
        message: `Day Pass para ${dates.join(", ")} — não é válido para hoje`,
      };
    }
    return { type: "warning", message: "Day Pass sem data definida" };
  }

  // Weekly Pass: válido por 7 dias a partir de week_pass_start_date
  const weeklyPasses = registrations.filter((r) =>
    r.ticket_type.toLowerCase().includes("week") || r.ticket_type.toLowerCase().includes("weekly")
  );
  if (weeklyPasses.length > 0) {
    const validWeekly = weeklyPasses.find((wp) => {
      if (!wp.week_pass_start_date) return false;
      const [y, m, d] = wp.week_pass_start_date.split("-").map(Number);
      const endDt = new Date(Date.UTC(y, m - 1, d + 6, 12));
      const endKey = `${endDt.getUTCFullYear()}-${String(endDt.getUTCMonth() + 1).padStart(2, "0")}-${String(endDt.getUTCDate()).padStart(2, "0")}`;
      return today >= wp.week_pass_start_date && today <= endKey;
    });
    if (validWeekly) {
      return { type: "ok", message: `Weekly Pass válido (até 7 dias a partir de ${validWeekly.week_pass_start_date})` };
    }
    return { type: "warning", message: "Weekly Pass fora da janela de 7 dias" };
  }

  if (selectedEvent && selectedEvent.id) {
    const hasEventReg = registrations.some(
      (r) => r.event_id === selectedEvent.id
    );
    if (hasEventReg) {
      return { type: "ok", message: "Inscrito neste evento" };
    }
    const hasNameMatch = registrations.some(
      (r) => r.event_name.toLowerCase() === selectedEvent.name.toLowerCase()
    );
    if (hasNameMatch) {
      return { type: "ok", message: "Inscrito neste evento" };
    }
    return {
      type: "warning",
      message: `Não inscrito neste evento. Ingressos: ${registrations.map((r) => r.ticket_type).join(", ")}`,
    };
  }

  return { type: "ok", message: `Ingresso: ${registrations.map((r) => r.ticket_type).join(", ")}` };
}

function CheckinPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [period, setPeriod] = useState<"Manhã" | "Tarde">("Manhã");
  const [accessType, setAccessType] = useState("IP Village");
  const [todayCheckins, setTodayCheckins] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searching, setSearching] = useState(false);
  const [confirmedPerson, setConfirmedPerson] = useState<{
    name: string; period: string; accessType: string;
  } | null>(null);

  // Event-centric state
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithStats[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventBase | null>(null);
  const [eventCheckins, setEventCheckins] = useState<any[]>([]);
  const [eventParticipants, setEventParticipants] = useState<EventParticipant[]>([]);
  const [eventCheckinCount, setEventCheckinCount] = useState(0);
  const [eventRegCount, setEventRegCount] = useState(0);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Access warning
  const [accessWarning, setAccessWarning] = useState<AccessWarning | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // Duplicate check-in detection
  const [duplicateCheckin, setDuplicateCheckin] = useState<{
    id: string; period: string; access_type: string; checked_in_at: string; event_name: string | null;
  } | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPeriod, setEditPeriod] = useState("");
  const [editAccessType, setEditAccessType] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Luma sync status
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [exportPeriod, setExportPeriod] = useState("Todos");
  const [exportAccessType, setExportAccessType] = useState("Todos");
  const [checkingInFromListId, setCheckingInFromListId] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const refreshLastSync = useCallback(async () => {
    try {
      const r = await getLastLumaSync();
      setLastSync(r.last_sync);
    } catch (err) {
      console.error("getLastLumaSync failed:", err);
    }
  }, []);

  const loadToday = useCallback(async () => {
    const [checkins, count, todayEvents] = await Promise.all([
      getTodayCheckins(),
      getTodayCount(),
      getTodayEventsWithStats(),
    ]);
    setTodayCheckins(checkins);
    setTodayCount(count);
    if (todayEvents.length > 0) {
      setEvents(todayEvents);
      setUpcomingEvents([]);
    } else {
      setEvents([]);
      const next = await getNextUpcomingEvents({ data: { limit: 3 } });
      setUpcomingEvents(next as EventWithStats[]);
    }
    setEventsLoaded(true);
  }, []);

  // biome-ignore lint: load on mount
  useEffect(() => {
    loadToday();
    refreshLastSync();
  }, []);

  // Re-render every 30s so "há X minutos" stays fresh
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const today = getCurrentBrasiliaDateKeySync();
      const result = await triggerLumaSync({ data: { since_date: today, until_date: today } });
      const t = result.totals;
      toast.success("Sincronização concluída", {
        description: `${result.events_processed} eventos · ${t.registrations} inscritos · ${t.checkins} check-ins`,
      });
      await Promise.all([loadToday(), refreshLastSync()]);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Falha ao sincronizar";
      toast.error("Erro na sincronização", { description: msg });
    } finally {
      setSyncing(false);
    }
  };

  const refreshSelectedEventData = useCallback(async (event: EventBase) => {
    const [checkins, checkinCount, regCount, participants] = await Promise.all([
      getEventCheckins({ data: { event_id: event.id } }),
      getEventCheckinCount({ data: { event_id: event.id } }),
      getEventRegistrationCount({ data: { event_id: event.id } }),
      getEventParticipants({ data: { event_id: event.id, event_date: event.date } }),
    ]);
    setEventCheckins(checkins);
    setEventCheckinCount(checkinCount);
    setEventRegCount(regCount);
    setEventParticipants(participants as EventParticipant[]);
  }, []);

  const handleExportEventCheckins = async (eventOverride?: EventBase, format: ExportFormat = "csv") => {
    const eventToExport = eventOverride || selectedEvent;
    if (!eventToExport) return;
    try {
      const rows = await getEventCheckedInParticipantsForExport({ data: { event_id: eventToExport.id } });
      const header = ["nome", "categoria", "acesso", "periodo", "checkin_em", "origem"];
      downloadRows(rows as ExportRow[], header, `${eventToExport.date}-${slugify(eventToExport.name)}-checkins`, format);
      toast.success(`${format.toUpperCase()} gerado`, { description: `${rows.length} check-ins exportados` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao exportar participantes";
      toast.error("Exportação não concluída", { description: msg });
    }
  };

  const handleExportTodayCheckins = async (format: ExportFormat = "csv") => {
    try {
      const rows = await getTodayCheckinsForExport({
        data: {
          period: exportPeriod === "Todos" ? undefined : exportPeriod,
          access_type: exportAccessType === "Todos" ? undefined : exportAccessType,
        },
      });
      const header = ["nome", "categoria", "acesso", "periodo", "evento", "checkin_em", "origem"];
      const filename = `${getCurrentBrasiliaDateKeySync()}-checkins${exportPeriod !== "Todos" ? `-${slugify(exportPeriod)}` : ""}${exportAccessType !== "Todos" ? `-${slugify(exportAccessType)}` : ""}`;
      downloadRows(rows as ExportRow[], header, filename, format);
      toast.success(`${format.toUpperCase()} gerado`, { description: `${rows.length} check-ins exportados` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao exportar check-ins";
      toast.error("Exportação não concluída", { description: msg });
    }
  };

  // Auto-refresh every 30 seconds
  const selectedEventRef = useRef(selectedEvent);
  selectedEventRef.current = selectedEvent;

  useEffect(() => {
    const interval = setInterval(async () => {
      const ev = selectedEventRef.current;
      if (ev && ev.id) {
        // Refresh event-specific data
        const [checkins, count] = await Promise.all([
          getEventCheckins({ data: { event_id: ev.id } }),
          getEventCheckinCount({ data: { event_id: ev.id } }),
        ]);
        setEventCheckins(checkins);
        setEventCheckinCount(count);
      }
      // Always refresh today's data
      const [allCheckins, allCount, todayEvents] = await Promise.all([
        getTodayCheckins(),
        getTodayCount(),
        getTodayEventsWithStats(),
      ]);
      setTodayCheckins(allCheckins);
      setTodayCount(allCount);
      setEvents(todayEvents);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const selectEvent = async (event: EventBase) => {
    setSelectedEvent(event);
    setQuery("");
    setResults([]);
    setSelected(null);
    setSuccess(false);
    setAccessWarning(null);
    await refreshSelectedEventData(event);
  };

  const handleSearch = async (value: string) => {
    setQuery(value);
    setSelected(null);
    setSuccess(false);
    setAccessWarning(null);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const people = selectedEvent
        ? await searchPeopleForEvent({ data: { query: value, event_id: selectedEvent.id } })
        : await searchPeople({ data: { query: value } });
      setResults(people);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPerson = async (person: Person) => {
    setSelected(person);
    setQuery(person.name);
    setResults([]);
    setDuplicateCheckin(null);

    // Fetch registrations, check access, and check for duplicate
    try {
      const [regs, duplicate] = await Promise.all([
        getPersonRegistrations({ data: { person_id: person.id } }),
        checkDuplicateCheckin({
          data: {
            person_id: person.id,
            event_id: selectedEvent?.id || undefined,
          },
        }),
      ]);
      setRegistrations(regs);
      const warning = checkAccess(regs, selectedEvent, selectedEvent?.date);
      setAccessWarning(warning);
      setDuplicateCheckin(duplicate as typeof duplicateCheckin);
    } catch {
      setAccessWarning({ type: "warning", message: "Não foi possível verificar inscrições" });
    }
  };

  const handleCheckin = async (force = false) => {
    if (!selected) return;
    if (!force && duplicateCheckin) return; // Safety guard
    setLoading(true);
    setDuplicateCheckin(null);
    try {
      await createCheckin({
        data: {
          person_id: selected.id,
          period,
          access_type: accessType,
          event_name: selectedEvent?.name || undefined,
          event_id: selectedEvent?.id || undefined,
        },
      });
      setConfirmedPerson({ name: selected.name, period, accessType });
      setSuccess(true);
      setQuery("");
      setResults([]);
      setAccessWarning(null);
      setDuplicateCheckin(null);
      setTimeout(() => {
        setSelected(null);
        setSuccess(false);
        setConfirmedPerson(null);
      }, 2000);

      if (selectedEvent) {
        await refreshSelectedEventData(selectedEvent);
      }
      const [allCheckins, allCount] = await Promise.all([getTodayCheckins(), getTodayCount()]);
      setTodayCheckins(allCheckins);
      setTodayCount(allCount);
    } catch (err) {
      console.error("Check-in failed:", err);
      const msg = err instanceof Error ? err.message : "Erro ao registrar check-in";
      toast.error("Falha no check-in", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantCheckin = async (participant: EventParticipant) => {
    if (!selectedEvent) return;
    setCheckingInFromListId(participant.id);
    try {
      await createCheckin({
        data: {
          person_id: participant.id,
          period,
          access_type: participant.access_type,
          event_name: selectedEvent.name,
          event_id: selectedEvent.id,
        },
      });
      toast.success("Check-in registrado", { description: participant.name });
      await refreshSelectedEventData(selectedEvent);
      const [allCheckins, allCount] = await Promise.all([getTodayCheckins(), getTodayCount()]);
      setTodayCheckins(allCheckins);
      setTodayCount(allCount);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao registrar check-in";
      toast.error("Falha no check-in", { description: msg });
    } finally {
      setCheckingInFromListId(null);
    }
  };

  const handleDelete = async (checkinId: string) => {
    try {
      await deleteCheckin({ data: { checkin_id: checkinId } });
      // Refresh
      if (selectedEvent && selectedEvent.id) {
        const [checkins, count] = await Promise.all([
          getEventCheckins({ data: { event_id: selectedEvent.id } }),
          getEventCheckinCount({ data: { event_id: selectedEvent.id } }),
        ]);
        setEventCheckins(checkins);
        setEventCheckinCount(count);
      }
      const [allCheckins, allCount] = await Promise.all([getTodayCheckins(), getTodayCount()]);
      setTodayCheckins(allCheckins);
      setTodayCount(allCount);
    } catch (err) {
      console.error(err);
    }
    setDeletingId(null);
  };

  const handleUpdate = async (checkinId: string) => {
    try {
      await updateCheckin({
        data: {
          checkin_id: checkinId,
          period: editPeriod || undefined,
          access_type: editAccessType || undefined,
        },
      });
      if (selectedEvent && selectedEvent.id) {
        const checkins = await getEventCheckins({ data: { event_id: selectedEvent.id } });
        setEventCheckins(checkins);
      }
      const allCheckins = await getTodayCheckins();
      setTodayCheckins(allCheckins);
    } catch (err) {
      console.error(err);
    }
    setEditingId(null);
  };

  const accessTypes = ["IP Village", "Day Pass", "Explorers", "Workshop/Café"];
  const exportAccessTypes = ["Todos", ...accessTypes];

  // Event selection screen
  if (!selectedEvent && eventsLoaded) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Check-in</h2>
              <p className="text-muted-foreground text-sm mt-1">Selecione o evento para iniciar</p>
            </div>
            <div className="glass-strong rounded-2xl px-5 py-3 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{todayCount}</span>
              <span className="text-sm text-muted-foreground">hoje</span>
            </div>
          </div>

          {/* Luma sync banner */}
          <div className="glass-subtle rounded-2xl px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className={`w-4 h-4 text-primary ${syncing ? "animate-spin" : ""}`} />
              <span className="text-muted-foreground">Última sincronização do Luma:</span>
              <span className="font-medium text-foreground">{formatRelativeTime(lastSync)}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={syncing}
              className="rounded-xl gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar agora"}
            </Button>
          </div>

          {events.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Eventos de hoje — {events.length} evento{events.length !== 1 ? "s" : ""}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
              {events.map((event) => {
                const pct = event.registration_count > 0
                  ? Math.min(100, Math.round((event.checkin_count / event.registration_count) * 100))
                  : 0;
                return (
                  <button
                    key={event.id}
                    onClick={() => selectEvent(event)}
                    className="w-full glass rounded-2xl p-5 text-left hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                          {event.name}
                        </h4>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {event.time && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {event.time}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                        {event.organizer && (
                          <span className="flex items-center gap-1.5 truncate">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{event.organizer}</span>
                          </span>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {event.registration_count} inscritos
                          </span>
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <UserCheck className="w-3 h-3" />
                            {event.checkin_count} check-ins
                          </span>
                        </div>
                        {event.registration_count > 0 && (
                          <span className="text-muted-foreground font-medium">{pct}%</span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {event.registration_count > 0 && (
                        <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/70 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Em breve
                </h3>
                <Badge className="bg-amber-500/15 text-amber-400 border-0 rounded-lg text-[10px]">
                  Nenhum evento hoje
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
              {upcomingEvents.map((event) => {
                const pct = event.registration_count > 0
                  ? Math.min(100, Math.round((event.checkin_count / event.registration_count) * 100))
                  : 0;
                return (
                  <button
                    key={event.id}
                    onClick={() => selectEvent(event)}
                    className="w-full glass rounded-2xl p-5 text-left hover:bg-primary/5 transition-all duration-200 group opacity-80 hover:opacity-100"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-amber-500/15 text-amber-400 border-0 rounded-lg text-[10px]">
                              {event.date}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                            {event.name}
                          </h4>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {event.time && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {event.time}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                        {event.organizer && (
                          <span className="flex items-center gap-1.5 truncate">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{event.organizer}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {event.registration_count} inscritos
                          </span>
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <UserCheck className="w-3 h-3" />
                            {event.checkin_count} check-ins
                          </span>
                        </div>
                        {event.registration_count > 0 && (
                          <span className="text-muted-foreground font-medium">{pct}%</span>
                        )}
                      </div>

                      {event.registration_count > 0 && (
                        <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400/60 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          ) : (
            <div className="glass rounded-3xl py-16 text-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum evento programado para hoje</p>
            </div>
          )}


          {todayCheckins.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
                Últimos check-ins
              </h3>
              <div className="space-y-2">
                {todayCheckins.slice(0, 10).map((c: any) => (
                  <div
                    key={c.id}
                    className="glass-subtle rounded-2xl flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{c.people?.name}</span>
                      {c.people?.tag && (
                        <Badge variant="secondary" className="text-xs rounded-lg">{c.people.tag}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {c.event_name && (
                        <Badge variant="outline" className="text-xs rounded-lg border-border/40 max-w-[150px] truncate">
                          {c.event_name}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(c.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  const isEventMode = selectedEvent && selectedEvent.id !== "";
  const currentCheckins = isEventMode ? eventCheckins : todayCheckins;
  const checkedInPersonIds = new Set(eventCheckins.map((c: any) => c.person_id));

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedEvent(null);
                setSelected(null);
                setQuery("");
                setResults([]);
                setSuccess(false);
                setAccessWarning(null);
              }}
              className="rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {isEventMode ? selectedEvent.name : "Check-in Avulso"}
              </h2>
              {isEventMode && selectedEvent.time && (
                <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedEvent.time}
                  {selectedEvent.location && (
                    <>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedEvent.location}
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEventMode && (
              <div className="glass-subtle rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Users className="w-4 h-4 text-secondary" />
                <span className="text-lg font-bold text-foreground">{eventRegCount}</span>
                <span className="text-xs text-muted-foreground">inscritos</span>
              </div>
            )}
            {isEventMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2">
                    <Download className="w-3.5 h-3.5" />
                    Baixar check-ins
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => handleExportEventCheckins(undefined, "csv")}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportEventCheckins(undefined, "xlsx")}>XLSX</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div className="glass-strong rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold text-foreground">
                {isEventMode ? eventCheckinCount : todayCount}
              </span>
              <span className="text-xs text-muted-foreground">check-ins</span>
            </div>
          </div>
        </div>

        {/* Search Card */}
        <div className="glass rounded-3xl p-8 space-y-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-14 text-lg rounded-2xl border-border/40 bg-background/60 focus:bg-background/80 transition-colors"
              autoFocus
            />
          </div>

          {/* Search results */}
          {results.length > 0 && !selected && (
            <div className="glass-subtle rounded-2xl overflow-hidden divide-y divide-border/30">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPerson(p)}
                  className="w-full text-left px-5 py-4 hover:bg-primary/5 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-semibold text-foreground">{p.name}</span>
                      {p.tag && (
                        <span className="text-muted-foreground text-xs ml-3">{p.tag}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.registered && (
                      <Badge className="bg-primary/12 text-primary border-0 rounded-lg text-xs">
                        Inscrito
                      </Badge>
                    )}
                    {p.tag && (
                      <Badge variant="secondary" className="text-xs rounded-lg">{p.tag}</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected person */}
          {selected && !success && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/6 border border-primary/15">
                <div className="w-12 h-12 rounded-2xl bg-primary/12 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{selected.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.registered && (
                    <Badge className="bg-primary/12 text-primary border-0 rounded-lg">Inscrito</Badge>
                  )}
                  {selected.tag && (
                    <Badge className="bg-secondary/12 text-secondary border-0 rounded-lg">{selected.tag}</Badge>
                  )}
                </div>
              </div>

              {/* Access Warning */}
              {accessWarning && (
                <div
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium ${
                    accessWarning.type === "ok"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : accessWarning.type === "warning"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {accessWarning.type === "ok" ? (
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                  )}
                  {accessWarning.message}
                </div>
              )}

              {/* Duplicate check-in warning */}
              {duplicateCheckin && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-400">Já fez check-in hoje</p>
                      <p className="text-xs text-amber-400/80 mt-0.5">
                        Registrado às{" "}
                        {new Date(duplicateCheckin.checked_in_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" — "}
                        {duplicateCheckin.period} · {duplicateCheckin.access_type}
                        {duplicateCheckin.event_name && ` · ${duplicateCheckin.event_name}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCheckin(true)}
                    disabled={loading}
                    className="w-full rounded-xl border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                  >
                    {loading ? "Registrando..." : "Confirmar mesmo assim"}
                  </Button>
                </div>
              )}

              {/* Period */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-medium w-20">Período</span>
                <div className="flex gap-2">
                  {(["Manhã", "Tarde"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={period === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPeriod(p)}
                      className="rounded-xl px-5"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Access Type */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground font-medium w-20">Acesso</span>
                <div className="flex gap-2">
                  {accessTypes.map((t) => (
                    <Button
                      key={t}
                      variant={accessType === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAccessType(t)}
                      className="rounded-xl px-5"
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Confirm — hidden when duplicate warning is shown (user must use the secondary button) */}
              {!duplicateCheckin && (
                <Button
                  onClick={() => handleCheckin(false)}
                  disabled={loading}
                  className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                  size="lg"
                >
                  {loading ? "Registrando..." : "Confirmar Check-in"}
                </Button>
              )}
            </div>
          )}

          {/* Success */}
          {success && confirmedPerson && (
            <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-24 h-24 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto ring-4 ring-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="text-emerald-400 font-black text-3xl tracking-tight">{confirmedPerson.name}</p>
                <p className="text-muted-foreground text-base font-medium">Check-in registrado!</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold">
                  {confirmedPerson.period}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {confirmedPerson.accessType}
                </span>
                {selectedEvent && (
                  <span className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold truncate max-w-[200px]">
                    {selectedEvent.name}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {isEventMode && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Inscritos e acessos válidos
              </h3>
              <Badge variant="outline" className="rounded-lg border-border/40">
                {eventParticipants.length} pessoas
              </Badge>
            </div>
            <div className="space-y-2">
              {eventParticipants.length === 0 && (
                <div className="glass-subtle rounded-2xl py-8 text-center">
                  <p className="text-muted-foreground text-sm">Nenhum inscrito encontrado para este evento</p>
                </div>
              )}
              {eventParticipants.map((participant) => {
                const alreadyCheckedIn = checkedInPersonIds.has(participant.id);
                return (
                  <div key={participant.id} className="glass-subtle rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">{participant.name}</span>
                        {participant.tag && <Badge variant="secondary" className="text-xs rounded-lg">{participant.tag}</Badge>}
                        {alreadyCheckedIn && <Badge className="bg-primary/12 text-primary border-0 rounded-lg text-xs">Check-in feito</Badge>}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground truncate max-w-full">{participant.ticket_type}</span>
                        <Badge variant="outline" className="rounded-lg border-primary/35 bg-primary/10 text-primary text-xs font-semibold">
                          Tipo de acesso: {participant.access_type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={alreadyCheckedIn ? "outline" : "default"}
                      disabled={alreadyCheckedIn || checkingInFromListId === participant.id}
                      onClick={() => handleParticipantCheckin(participant)}
                      className="rounded-xl gap-2 shrink-0"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {checkingInFromListId === participant.id ? "Registrando..." : alreadyCheckedIn ? "Feito" : "Check-in"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Check-ins feed with edit/delete */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">
            {isEventMode ? "Check-ins deste evento" : "Check-ins de hoje"}
          </h3>
          <div className="space-y-2">
            {currentCheckins.length === 0 && (
              <div className="glass-subtle rounded-2xl py-8 text-center">
                <p className="text-muted-foreground text-sm">Nenhum check-in registrado</p>
              </div>
            )}
            {currentCheckins.map((c: any) => (
              <div
                key={c.id}
                className="glass-subtle rounded-2xl px-5 py-3.5"
              >
                {editingId === c.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{c.people?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-muted-foreground w-16">Período</span>
                      {(["Manhã", "Tarde"] as const).map((p) => (
                        <Button
                          key={p}
                          variant={editPeriod === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditPeriod(p)}
                          className="rounded-lg text-xs h-7 px-3"
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-muted-foreground w-16">Acesso</span>
                      {accessTypes.map((t) => (
                        <Button
                          key={t}
                          variant={editAccessType === t ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditAccessType(t)}
                          className="rounded-lg text-xs h-7 px-3"
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg h-8"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(c.id)}
                        className="rounded-lg h-8"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : deletingId === c.id ? (
                  // Delete confirmation
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-destructive font-medium">
                      Desfazer check-in de {c.people?.name}?
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(null)}
                        className="rounded-lg h-8"
                      >
                        Não
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                        className="rounded-lg h-8"
                      >
                        Sim, desfazer
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Normal view
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{c.people?.name}</span>
                      {c.people?.tag && (
                        <Badge variant="secondary" className="text-xs rounded-lg">{c.people.tag}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs rounded-lg border-border/40">{c.access_type}</Badge>
                      <span>{c.period}</span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(c.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setEditPeriod(c.period);
                          setEditAccessType(c.access_type);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(c.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                        title="Desfazer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
