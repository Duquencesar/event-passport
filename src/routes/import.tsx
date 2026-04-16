import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileUp,
  CheckCircle,
  CalendarDays,
  RefreshCw,
  Zap,
  AlertTriangle,
  ChevronRight,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { importPeople } from "@/server/import.functions";
import { getUpcomingEvents } from "@/server/event.functions";
import { lumaListEvents, lumaSyncEvent } from "@/server/luma.functions";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Importar — Ipê Village Check-In" },
      { name: "description", content: "Importação de inscritos do Luma" },
    ],
  }),
  component: ImportPage,
});

type Event = { id: string; name: string; date: string; time: string | null };
type LumaEvent = {
  api_id: string;
  name: string;
  date: string;
  time: string;
  location: string | null;
  organizer: string | null;
  url: string | null;
  start_at: string;
};

// ─── CSV Import tab ───────────────────────────────────────────────────────────

function CsvImportTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: "",
    email: "",
    ticket_type: "",
    event_name: "",
    tag: "",
  });
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; registrations: number } | null>(null);
  const [eventNameOverride, setEventNameOverride] = useState("");
  const [defaultTag, setDefaultTag] = useState("");

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    getUpcomingEvents().then(setEvents).catch(console.error);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    Papa.parse(file, {
      complete: (res) => {
        const data = res.data as string[][];
        if (data.length < 2) return;
        const h = data[0];
        setHeaders(h);
        setRows(data.slice(1).filter((r) => r.some((c) => c?.trim())));
        const auto: Record<string, string> = { name: "", email: "", ticket_type: "", event_name: "", tag: "" };
        for (const col of h) {
          const lower = col.toLowerCase();
          if (lower.includes("name") && !lower.includes("event") && !auto.name) auto.name = col;
          if (lower.includes("email") && !auto.email) auto.email = col;
          if (lower.includes("ticket") && !auto.ticket_type) auto.ticket_type = col;
          if (lower.includes("event") && !auto.event_name) auto.event_name = col;
        }
        setMapping(auto);
      },
    });
  };

  const handleImport = async () => {
    if (!mapping.name || !mapping.email) return;
    setImporting(true);
    const nameIdx = headers.indexOf(mapping.name);
    const emailIdx = headers.indexOf(mapping.email);
    const ticketIdx = mapping.ticket_type ? headers.indexOf(mapping.ticket_type) : -1;
    const eventIdx = mapping.event_name ? headers.indexOf(mapping.event_name) : -1;
    const tagIdx = mapping.tag ? headers.indexOf(mapping.tag) : -1;
    const selectedEvent = events.find((e) => e.id === selectedEventId);
    const eventFallback = selectedEvent?.name || eventNameOverride || "Evento";
    const mapped = rows
      .filter((r) => r[nameIdx]?.trim() && r[emailIdx]?.trim())
      .map((r) => ({
        name: r[nameIdx].trim(),
        email: r[emailIdx].trim(),
        ticket_type: ticketIdx >= 0 ? r[ticketIdx]?.trim() || "Geral" : "Geral",
        event_name: eventFallback || (eventIdx >= 0 ? r[eventIdx]?.trim() || "Evento" : "Evento"),
        tag: tagIdx >= 0 ? r[tagIdx]?.trim() || undefined : undefined,
        event_id: selectedEventId && selectedEventId !== "__none__" ? selectedEventId : undefined,
      }));
    try {
      const resolvedDefaultTag = defaultTag && defaultTag !== "__none__" ? defaultTag : undefined;
      const res = await importPeople({ data: { rows: mapped, default_tag: resolvedDefaultTag } });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Event selector */}
      {events.length > 0 && (
        <div className="glass rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Associar a um evento</h3>
          </div>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="rounded-xl bg-background/50">
              <SelectValue placeholder="Selecionar evento (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Nenhum evento —</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.date} — {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Upload */}
      <div className="glass rounded-3xl p-8">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border/40 rounded-2xl p-14 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all duration-300"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Clique ou arraste um arquivo CSV</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Exportado do Luma ou similar</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>
      </div>

      {/* Mapping */}
      {headers.length > 0 && !result && (
        <div className="glass rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Mapeamento de colunas</h3>
            <Badge className="bg-primary/10 text-primary border-0 rounded-lg">{rows.length} linhas</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([
              ["name", "Nome *"],
              ["email", "Email *"],
              ["ticket_type", "Tipo de Ticket"],
              ["event_name", "Nome do Evento"],
              ["tag", "Tag (ex: Arquiteto)"],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-sm text-muted-foreground font-medium">{label}</label>
                <Select value={mapping[key]} onValueChange={(v) => setMapping({ ...mapping, [key]: v })}>
                  <SelectTrigger className="rounded-xl bg-background/50">
                    <SelectValue placeholder="Selecionar coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Nenhuma —</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {!selectedEventId && (
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground font-medium">Sobrescrever evento</label>
                <Input
                  placeholder="Nome fixo para todos (opcional)"
                  value={eventNameOverride}
                  onChange={(e) => setEventNameOverride(e.target.value)}
                  className="rounded-xl bg-background/50"
                />
              </div>
            )}
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm text-muted-foreground font-medium">
                Tag padrão{" "}
                <span className="text-muted-foreground/60">(para quem não tiver tag na coluna acima)</span>
              </label>
              <Select value={defaultTag} onValueChange={setDefaultTag}>
                <SelectTrigger className="rounded-xl bg-background/50">
                  <SelectValue placeholder="Sem tag padrão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sem tag padrão —</SelectItem>
                  <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                  <SelectItem value="Explorer">Explorer</SelectItem>
                  <SelectItem value="Day Pass">Day Pass</SelectItem>
                </SelectContent>
              </Select>
              {defaultTag && defaultTag !== "__none__" && (
                <p className="text-xs text-amber-400/80">
                  Inscritos sem tag receberão a tag <strong>{defaultTag}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="glass-subtle rounded-2xl overflow-auto max-h-60">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h) => (
                    <TableHead key={h} className="text-xs whitespace-nowrap font-semibold">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 5).map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className="text-xs whitespace-nowrap">{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            onClick={handleImport}
            disabled={importing || !mapping.name || !mapping.email}
            className="w-full h-13 font-bold rounded-2xl shadow-lg shadow-primary/20 text-base"
          >
            <FileUp className="w-5 h-5 mr-2" />
            {importing ? "Importando..." : `Importar ${rows.length} registros`}
          </Button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/12 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xl font-bold text-primary">Importação concluída!</p>
          <div className="flex justify-center gap-8 text-sm">
            <span><strong className="text-lg">{result.created}</strong><span className="text-muted-foreground ml-1">novos</span></span>
            <span><strong className="text-lg">{result.updated}</strong><span className="text-muted-foreground ml-1">atualizados</span></span>
            <span><strong className="text-lg">{result.registrations}</strong><span className="text-muted-foreground ml-1">inscrições</span></span>
          </div>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { setHeaders([]); setRows([]); setResult(null); }}>
            Importar outro arquivo
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Luma Sync tab ────────────────────────────────────────────────────────────

function LumaSyncTab() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [calendarId, setCalendarId] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [lumaEvents, setLumaEvents] = useState<LumaEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [defaultTag, setDefaultTag] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<Array<{
    name: string;
    total_guests: number;
    created: number;
    updated: number;
    registrations: number;
  }>>([]);
  const [syncDone, setSyncDone] = useState(false);

  const fetchEvents = async () => {
    if (!apiKey.trim() || !calendarId.trim()) return;
    setLoadingEvents(true);
    setError(null);
    setLumaEvents([]);
    try {
      const events = await lumaListEvents({ data: { api_key: apiKey.trim(), calendar_api_id: calendarId.trim() } });
      setLumaEvents(events as LumaEvent[]);
    } catch (err: any) {
      setError(err?.message || "Erro ao conectar com o Luma. Verifique a API Key e o Calendar ID.");
    } finally {
      setLoadingEvents(false);
    }
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedEvents(new Set(lumaEvents.map((e) => e.api_id)));
  const clearAll = () => setSelectedEvents(new Set());

  const handleSync = async () => {
    if (selectedEvents.size === 0) return;
    setSyncing(true);
    setSyncResults([]);
    setSyncDone(false);

    const resolvedTag = defaultTag && defaultTag !== "__none__" ? defaultTag : undefined;
    const toSync = lumaEvents.filter((e) => selectedEvents.has(e.api_id));
    const results: typeof syncResults = [];

    for (const event of toSync) {
      try {
        const res = await lumaSyncEvent({
          data: {
            api_key: apiKey.trim(),
            luma_event_id: event.api_id,
            event_name: event.name,
            event_date: event.date,
            event_time: event.time,
            event_location: event.location,
            event_organizer: event.organizer,
            event_url: event.url,
            default_tag: resolvedTag,
          },
        });
        results.push({
          name: event.name,
          total_guests: (res as any).total_guests,
          created: (res as any).created,
          updated: (res as any).updated,
          registrations: (res as any).registrations,
        });
      } catch (err: any) {
        results.push({
          name: event.name,
          total_guests: -1,
          created: 0,
          updated: 0,
          registrations: 0,
        });
      }
    }

    setSyncResults(results);
    setSyncDone(true);
    setSyncing(false);
  };

  return (
    <div className="space-y-8">
      {/* Info banner */}
      <div className="glass rounded-2xl px-5 py-4 flex items-start gap-3 border border-primary/15">
        <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Sincronização direta com o Luma</p>
          <p className="text-sm text-muted-foreground">
            Importa eventos e participantes diretamente via API, sem precisar exportar CSV.
            Encontre sua API Key em <strong>lu.ma → Settings → Integrations → API Keys</strong>.
            O Calendar API ID está na URL do seu calendário:{" "}
            <span className="font-mono text-xs bg-muted/40 px-1.5 py-0.5 rounded">lu.ma/c/</span>
            <strong>cal_xxxxxx</strong>.
          </p>
        </div>
      </div>

      {/* Credentials */}
      <div className="glass rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-semibold">Credenciais Luma</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground font-medium">API Key</label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="luma_api_key_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="rounded-xl bg-background/50 pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground font-medium">Calendar API ID</label>
            <Input
              placeholder="cal_xxxxxxxxxxxxxx"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="rounded-xl bg-background/50 font-mono text-sm"
            />
          </div>
        </div>
        <Button
          onClick={fetchEvents}
          disabled={loadingEvents || !apiKey.trim() || !calendarId.trim()}
          className="rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingEvents ? "animate-spin" : ""}`} />
          {loadingEvents ? "Buscando eventos..." : "Buscar eventos do Luma"}
        </Button>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Event list */}
      {lumaEvents.length > 0 && !syncDone && (
        <div className="glass rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold">{lumaEvents.length} eventos encontrados</h3>
              <Badge className="bg-primary/10 text-primary border-0 rounded-lg text-xs">
                {selectedEvents.size} selecionados
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAll} className="rounded-xl text-xs">
                Selecionar todos
              </Button>
              <Button size="sm" variant="outline" onClick={clearAll} className="rounded-xl text-xs">
                Limpar
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {lumaEvents.map((event) => {
              const selected = selectedEvents.has(event.api_id);
              return (
                <button
                  key={event.api_id}
                  onClick={() => toggleEvent(event.api_id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-150 flex items-center gap-3 ${
                    selected
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/20 border border-transparent hover:bg-muted/30"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected ? "bg-primary border-primary" : "border-border/50"
                  }`}>
                    {selected && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.date}
                      {event.time && ` às ${event.time}`}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Default tag */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground font-medium">
              Tag padrão <span className="text-muted-foreground/60">(para participantes sem tipo de ticket definido)</span>
            </label>
            <Select value={defaultTag} onValueChange={setDefaultTag}>
              <SelectTrigger className="rounded-xl bg-background/50 w-60">
                <SelectValue placeholder="Sem tag padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sem tag padrão —</SelectItem>
                <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                <SelectItem value="Explorer">Explorer</SelectItem>
                <SelectItem value="Day Pass">Day Pass</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSync}
            disabled={syncing || selectedEvents.size === 0}
            className="w-full h-12 font-bold rounded-2xl shadow-lg shadow-primary/20"
          >
            <Users className="w-5 h-5 mr-2" />
            {syncing
              ? "Sincronizando..."
              : `Sincronizar ${selectedEvents.size} evento${selectedEvents.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}

      {/* Sync progress */}
      {syncing && (
        <div className="glass rounded-3xl p-6 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Sincronizando participantes do Luma...</p>
          <p className="text-xs text-muted-foreground/60">
            Isso pode levar alguns segundos por evento.
          </p>
        </div>
      )}

      {/* Results */}
      {syncDone && syncResults.length > 0 && (
        <div className="glass rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-primary" />
            <h3 className="font-bold text-lg">Sincronização concluída!</h3>
          </div>
          <div className="space-y-3">
            {syncResults.map((r, i) => (
              <div key={i} className="glass-subtle rounded-2xl px-4 py-3">
                <p className="font-medium text-sm mb-2 truncate">{r.name}</p>
                {r.total_guests < 0 ? (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Erro ao sincronizar este evento
                  </p>
                ) : (
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span><strong className="text-foreground">{r.total_guests}</strong> participantes</span>
                    <span><strong className="text-emerald-400">{r.created}</strong> novos</span>
                    <span><strong className="text-primary">{r.updated}</strong> atualizados</span>
                    <span><strong className="text-secondary">{r.registrations}</strong> inscrições</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => { setSyncDone(false); setSyncResults([]); setSelectedEvents(new Set()); }}
          >
            Sincronizar novamente
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ImportPage() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Importar Inscritos</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Importe via CSV ou sincronize diretamente com o Luma
          </p>
        </div>

        <Tabs defaultValue="luma" className="space-y-6">
          <TabsList className="rounded-2xl bg-muted/40 p-1 h-auto gap-1">
            <TabsTrigger value="luma" className="rounded-xl px-5 py-2 flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Zap className="w-4 h-4" />
              Luma API
            </TabsTrigger>
            <TabsTrigger value="csv" className="rounded-xl px-5 py-2 flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Upload className="w-4 h-4" />
              CSV manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="luma" className="mt-0">
            <LumaSyncTab />
          </TabsContent>

          <TabsContent value="csv" className="mt-0">
            <CsvImportTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
