import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserCheck, Clock } from "lucide-react";
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
      <div className="space-y-6">
        {/* Counter */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Check-in</h2>
          <Badge variant="outline" className="text-lg px-4 py-1.5 border-primary/30 text-primary">
            <UserCheck className="w-5 h-5 mr-2" />
            {todayCount} hoje
          </Badge>
        </div>

        {/* Search + Config */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-12 text-lg bg-background/50"
                autoFocus
              />
            </div>

            {/* Search results */}
            {results.length > 0 && !selected && (
              <div className="border border-border rounded-md overflow-hidden divide-y divide-border">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      setQuery(p.name);
                      setResults([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground text-sm ml-3">{p.email}</span>
                    </div>
                    {p.tag && (
                      <Badge variant="secondary" className="text-xs">
                        {p.tag}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Selected person */}
            {selected && !success && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">{selected.name}</p>
                    <p className="text-sm text-muted-foreground">{selected.email}</p>
                  </div>
                  {selected.tag && (
                    <Badge variant="secondary" className="ml-auto">
                      {selected.tag}
                    </Badge>
                  )}
                </div>

                {/* Period */}
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground self-center w-20">Período:</span>
                  {(["Manhã", "Tarde"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={period === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPeriod(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>

                {/* Access Type */}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground self-center w-20">Acesso:</span>
                  {accessTypes.map((t) => (
                    <Button
                      key={t}
                      variant={accessType === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAccessType(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>

                {/* Event name */}
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground w-20">Evento:</span>
                  <Input
                    placeholder="Nome do evento (opcional)"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                {/* Confirm */}
                <Button
                  onClick={handleCheckin}
                  disabled={loading}
                  className="w-full h-12 text-lg font-bold"
                  size="lg"
                >
                  {loading ? "Registrando..." : "Confirmar Check-in"}
                </Button>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-primary font-bold text-lg">Check-in registrado!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's feed */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Check-ins de hoje
          </h3>
          <div className="space-y-2">
            {todayCheckins.length === 0 && (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Nenhum check-in registrado hoje
              </p>
            )}
            {todayCheckins.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-card border border-border/30"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{c.people?.name}</span>
                  {c.people?.tag && (
                    <Badge variant="secondary" className="text-xs">
                      {c.people.tag}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {c.access_type}
                  </Badge>
                  <span>{c.period}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
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
