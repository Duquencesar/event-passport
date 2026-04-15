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
} from "lucide-react";
import {
  searchPeople,
  searchPeopleForEvent,
  createCheckin,
  getEventCheckins,
  getTodayCheckins,
  getTodayCount,
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
      setTimeout(() => {
        setSelected(null);
        setSuccess(false);
      }, 2000);

      // Refresh counts
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

  const accessTypes = ["IP Village", "Day Pass", "Workshop/Café"];

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

          {/* Today's events */}
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

          {/* Quick check-in without event */}
          <button
            onClick={() => setSelectedEvent({ id: "", name: "", date: "", time: null, organizer: null, location: null })}
            className="w-full glass-subtle rounded-2xl p-4 text-center text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
          >
            Check-in avulso (sem evento específico)
          </button>

          {/* Today's feed */}
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

  // Check-in screen (with or without event)
  const isEventMode = selectedEvent && selectedEvent.id !== "";

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
                  onClick={() => {
                    setSelected(p);
                    setQuery(p.name);
                    setResults([]);
                  }}
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

        {/* Event check-ins feed */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">
            {isEventMode ? "Check-ins deste evento" : "Check-ins de hoje"}
          </h3>
          <div className="space-y-2">
            {(isEventMode ? eventCheckins : todayCheckins).length === 0 && (
              <div className="glass-subtle rounded-2xl py-8 text-center">
                <p className="text-muted-foreground text-sm">Nenhum check-in registrado</p>
              </div>
            )}
            {(isEventMode ? eventCheckins : todayCheckins).map((c: any) => (
              <div
                key={c.id}
                className="glass-subtle rounded-2xl flex items-center justify-between px-5 py-3.5"
              >
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
