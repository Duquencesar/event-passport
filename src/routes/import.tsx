import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { Layout } from "@/components/Layout";
import { SectionBadge } from "@/components/SectionBadge";
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
} from "lucide-react";
import { importPeople } from "@/server/import.functions";
import { getUpcomingEvents } from "@/server/event.functions";
import { lumaSyncAll } from "@/server/luma.functions";

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
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0884c7] to-[#29B6F6] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_14px_rgba(41,182,246,0.3)]">
            <Upload className="w-7 h-7 text-white" />
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
                  <SelectItem value="Weekly">Weekly Pass</SelectItem>
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
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [autoResult, setAutoResult] = useState<{
    events_processed: number;
    totals: { guests: number; created: number; updated: number; registrations: number; checkins: number };
  } | null>(null);
  const [autoError, setAutoError] = useState<string | null>(null);

  const handleAutoSync = async () => {
    setAutoSyncing(true);
    setAutoError(null);
    setAutoResult(null);
    try {
      const res = await lumaSyncAll({ data: {} });
      setAutoResult({ events_processed: (res as any).events_processed, totals: (res as any).totals });
    } catch (err: any) {
      setAutoError(err?.message || "Erro ao sincronizar com o Luma.");
    } finally {
      setAutoSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Sync automático (usa secrets do servidor) */}
      <div className="glass rounded-3xl p-6 space-y-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-semibold">Sincronização automática</h3>
            <p className="text-sm text-muted-foreground">
              Importa <strong>todos os eventos futuros</strong> do calendário do Ipê Village + inscritos + check-ins
              feitos no app do Luma. Roda automaticamente toda hora; clique abaixo para forçar agora.
            </p>
          </div>
        </div>
        <Button
          onClick={handleAutoSync}
          disabled={autoSyncing}
          className="w-full h-12 font-bold rounded-2xl shadow-lg shadow-primary/20"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${autoSyncing ? "animate-spin" : ""}`} />
          {autoSyncing ? "Sincronizando…" : "Sincronizar tudo agora"}
        </Button>
        {autoError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{autoError}</span>
          </div>
        )}
        {autoResult && (
          <div className="glass-subtle rounded-2xl px-4 py-3 space-y-2">
            <p className="text-sm font-semibold text-primary flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {autoResult.events_processed} eventos sincronizados
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-muted-foreground">
              <span><strong className="text-foreground">{autoResult.totals.guests}</strong> participantes</span>
              <span><strong className="text-emerald-400">{autoResult.totals.created}</strong> novos</span>
              <span><strong className="text-primary">{autoResult.totals.updated}</strong> atualizados</span>
              <span><strong className="text-secondary">{autoResult.totals.registrations}</strong> inscrições</span>
              <span><strong className="text-amber-400">{autoResult.totals.checkins}</strong> check-ins</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ImportPage() {
  return (
    <Layout>
      <div className="space-y-8 max-w-2xl">
        <div className="fade-up">
          <SectionBadge label="IMPORTAÇÃO" pulse={false} className="mb-3" />
          <h1
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: "1.1" }}
          >
            Importar <span className="gradient-text">Pessoas</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Importe via CSV ou sincronize diretamente com o Luma
          </p>
        </div>

        <Tabs defaultValue="luma" className="space-y-6">
          <TabsList className="glass rounded-xl p-1 h-auto gap-1">
            <TabsTrigger
              value="luma"
              className="rounded-lg px-5 py-2 text-sm flex items-center gap-2 data-[state=active]:text-[#84E400] data-[state=active]:bg-[#84E400]/10"
            >
              <Zap className="w-4 h-4" />
              Luma API
            </TabsTrigger>
            <TabsTrigger
              value="csv"
              className="rounded-lg px-5 py-2 text-sm flex items-center gap-2 data-[state=active]:text-[#84E400] data-[state=active]:bg-[#84E400]/10"
            >
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
