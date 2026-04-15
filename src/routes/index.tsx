import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, Clock, CheckCircle2 } from "lucide-react";
import {
  searchPeople,
  createCheckin,
  getTodayCheckins,
  getTodayCount,
} from "@/server/checkin.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ipê Village - Check-In" },
      { name: "description", content: "Sistema de check-in para Ipê Village" },
    ],
  }),
  component: CheckinPage,
});

type Person = { id: string; name: string; email: string; tag: string | null };

function CheckinPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [period, setPeriod] = useState<"Manhã" | "Tarde">("Manhã");
  const [accessType, setAccessType] = useState("IP Village");
  const [eventName, setEventName] = useState("");
  const [todayCheckins, setTodayCheckins] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searching, setSearching] = useState(false);

  const loadToday = useCallback(async () => {
    const [checkins, count] = await Promise.all([getTodayCheckins(), getTodayCount()]);
    setTodayCheckins(checkins);
    setTodayCount(count);
  }, []);

  // Load on mount
  useState(() => {
    loadToday();
  });

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
      const people = await searchPeople({ data: { query: value } });
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
          event_name: eventName || undefined,
        },
      });
      setSuccess(true);
      setQuery("");
      setResults([]);
      setTimeout(() => {
        setSelected(null);
        setSuccess(false);
      }, 2000);
      loadToday();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const accessTypes = ["IP Village", "Day Pass", "Workshop/Café"];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Check-in</h2>
            <p className="text-muted-foreground text-sm mt-1">Registrar presença de participantes</p>
          </div>
          <div className="glass-strong rounded-2xl px-5 py-3 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{todayCount}</span>
            <span className="text-sm text-muted-foreground">hoje</span>
          </div>
        </div>

        {/* Search Card */}
        <div className="glass rounded-3xl p-8 space-y-5">
          {/* Search */}
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
                  <div>
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <span className="text-muted-foreground text-sm ml-3">{p.email}</span>
                  </div>
                  {p.tag && (
                    <Badge variant="secondary" className="text-xs rounded-lg">
                      {p.tag}
                    </Badge>
                  )}
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
                {selected.tag && (
                  <Badge className="bg-primary/12 text-primary border-0 rounded-lg font-medium">
                    {selected.tag}
                  </Badge>
                )}
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

              {/* Event name */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-medium w-20">Evento</span>
                <Input
                  placeholder="Nome do evento (opcional)"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="rounded-xl bg-background/50"
                />
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

        {/* Today's feed */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">
            Check-ins de hoje
          </h3>
          <div className="space-y-2">
            {todayCheckins.length === 0 && (
              <div className="glass-subtle rounded-2xl py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Nenhum check-in registrado hoje
                </p>
              </div>
            )}
            {todayCheckins.map((c: any) => (
              <div
                key={c.id}
                className="glass-subtle rounded-2xl flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{c.people?.name}</span>
                  {c.people?.tag && (
                    <Badge variant="secondary" className="text-xs rounded-lg">
                      {c.people.tag}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs rounded-lg border-border/40">
                    {c.access_type}
                  </Badge>
                  <span>{c.period}</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(c.checked_in_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
