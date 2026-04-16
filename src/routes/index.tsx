import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import {
  searchPeople,
  searchPeopleForEvent,
  createCheckin,
  getEventCheckins,
  getTodayCheckins,
  getTodayCount,
  deleteCheckin,
  updateCheckin,
  getPersonRegistrations,
} from "@/server/checkin.functions";
import { getTodayEvents, getEventCheckinCount, getEventRegistrationCount } from "@/server/event.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ipê Village - Check-In" },
      { name: "description", content: "Sistema de check-in para Ipê Village" },
    ],
  }),
  component: CheckinPage,
});

type Person = { id: string; name: string; email: string; tag: string | null; registered?: boolean };
type Event = { id: string; name: string; date: string; time: string | null; organizer: string | null; location: string | null };
type Registration = { id: string; event_name: string; ticket_type: string; day_pass_date: string | null; event_id: string | null };

type AccessWarning = {
  type: "ok" | "warning" | "danger";
  message: string;
};

function checkAccess(
  registrations: Registration[],
  selectedEvent: Event | null,
  eventDate?: string,
): AccessWarning {
  if (!registrations.length) {
    return { type: "danger", message: "Sem inscrição encontrada" };
  }

  const ticketTypes = registrations.map((r) => r.ticket_type.toLowerCase());
  
  // Architect and Explorer have full access
  const hasFullAccess = ticketTypes.some(
    (t) => t.includes("architect") || t.includes("explorer")
  );
  if (hasFullAccess) {
    const accessType = ticketTypes.find((t) => t.includes("architect"))
      ? "Architect"
      : "Explorer";
    return { type: "ok", message: `Acesso total (${accessType})` };
  }

  // Day Pass - check date
  const dayPasses = registrations.filter((r) =>
    r.ticket_type.toLowerCase().includes("day pass") || r.ticket_type.toLowerCase().includes("day-pass")
  );
  if (dayPasses.length > 0) {
    const today = eventDate || new Date().toISOString().split("T")[0];
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

  // Event-specific ticket
  if (selectedEvent && selectedEvent.id) {
    const hasEventReg = registrations.some(
      (r) => r.event_id === selectedEvent.id
    );
    if (hasEventReg) {
      return { type: "ok", message: "Inscrito neste evento" };
    }
    // Check by name match
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

  // Event-centric state
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventCheckins, setEventCheckins] = useState<any[]>([]);
  const [eventCheckinCount, setEventCheckinCount] = useState(0);
  const [eventRegCount, setEventRegCount] = useState(0);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Access warning
  const [accessWarning, setAccessWarning] = useState<AccessWarning | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPeriod, setEditPeriod] = useState("");
  const [editAccessType, setEditAccessType] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadToday = useCallback(async () => {
    const [checkins, count, todayEvents] = await Promise.all([
      getTodayCheckins(),
      getTodayCount(),
      getTodayEvents(),
    ]);
    setTodayCheckins(checkins);
    setTodayCount(count);
    setEvents(todayEvents);
    setEventsLoaded(true);
  }, []);

  useState(() => {
    loadToday();
  });

  const selectEvent = async (event: Event) => {
    setSelectedEvent(event);
    setQuery("");
    setResults([]);
    setSelected(null);
    setSuccess(false);
    setAccessWarning(null);
    const [checkins, checkinCount, regCount] = await Promise.all([
      getEventCheckins({ data: { event_id: event.id } }),
      getEventCheckinCount({ data: { event_id: event.id } }),
      getEventRegistrationCount({ data: { event_id: event.id } }),
    ]);
    setEventCheckins(checkins);
    setEventCheckinCount(checkinCount);
    setEventRegCount(regCount);
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

    // Fetch registrations and check access
    try {
      const regs = await getPersonRegistrations({ data: { person_id: person.id } });
      setRegistrations(regs);
      const warning = checkAccess(regs, selectedEvent, selectedEvent?.date);
      setAccessWarning(warning);
    } catch {
      setAccessWarning({ type: "warning", message: "Não foi possível verificar inscrições" });
    }
  };

  const handleCheckin = async () => {
    if (!selected) return;
    setLoading(true);
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
      setSuccess(true);
      setQuery("");
      setResults([]);
      setAccessWarning(null);
      setTimeout(() => {
        setSelected(null);
        setSuccess(false);
      }, 2000);

      if (selectedEvent) {
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
    } finally {
      setLoading(false);
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

          {events.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Eventos de hoje
              </h3>
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => selectEvent(event)}
                  className="w-full glass rounded-2xl p-5 text-left hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {event.name}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="glass rounded-3xl py-16 text-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum evento programado para hoje</p>
            </div>
          )}

          <button
            onClick={() => setSelectedEvent({ id: "", name: "", date: "", time: null, organizer: null, location: null })}
            className="w-full glass-subtle rounded-2xl p-4 text-center text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
          >
            Check-in avulso (sem evento específico)
          </button>

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
              placeholder="Buscar por nome ou email..."
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
                      <span className="text-muted-foreground text-sm ml-3">{p.email}</span>
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
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
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

              {/* Confirm */}
              <Button
                onClick={handleCheckin}
                disabled={loading}
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                size="lg"
              >
                {loading ? "Registrando..." : "Confirmar Check-in"}
              </Button>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/12 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <p className="text-primary font-bold text-xl">Check-in registrado!</p>
            </div>
          )}
        </div>

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
