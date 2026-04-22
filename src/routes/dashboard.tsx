import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentBrasiliaDateKeySync, shiftBrasiliaDateKeyByDays } from "@/lib/brasilia-time";
import {
  Users,
  HardHat,
  TrendingUp,
  RefreshCw,
  Download,
  CalendarDays,
  PlayCircle,
  UserCheck,
  UserX,
  ShieldX,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getDashboardStats,
  getDailyAttendance,
  getAccessTypeBreakdown,
  getTopAttendees,
  getCheckinsForExport,
  getEventsForDashboard,
  getEventOperations,
} from "@/server/dashboard.functions";
import { prepareHouseDemoAction } from "@/server/house-demo.functions";
import { toast } from "sonner";

const loadDashboard = async (from: string, to: string, event_id?: string) => {
  const [stats, daily, breakdown, topPeople, events] = await Promise.all([
    getDashboardStats({ data: { from, to, event_id } }),
    getDailyAttendance({ data: { from, to, event_id } }),
    getAccessTypeBreakdown({ data: { from, to, event_id } }),
    getTopAttendees({ data: { from, to, event_id } }),
    getEventsForDashboard({ data: { from, to } }),
  ]);
  return { stats, daily, breakdown, topPeople, events };
};

const loadOperations = async (
  event_id: string,
  attendance_page = 1,
  absences_page = 1,
  denied_page = 1,
  page_size = 8,
) => {
  return getEventOperations({
    data: { event_id, attendance_page, absences_page, denied_page, page_size },
  });
};

type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
type EventOperationsData = Awaited<ReturnType<typeof loadOperations>>;

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ipê Village Check-In" },
      { name: "description", content: "Analytics do Ipê Village" },
    ],
  }),
  loaderDeps: ({ search }) => ({
    from: (search as Record<string, string>).from,
    to: (search as Record<string, string>).to,
  }),
  loader: async ({ deps }) => {
    const today = getCurrentBrasiliaDateKeySync();
    const from = deps.from || shiftBrasiliaDateKeyByDays(today, -30);
    const to = deps.to || today;
    return loadDashboard(from, to);
  },
  component: DashboardPage,
});

const PIE_COLORS = [
  "oklch(0.72 0.19 135)",
  "oklch(0.68 0.12 240)",
  "oklch(0.65 0.14 180)",
  "oklch(0.74 0.16 85)",
];

function DashboardPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const initialTo = getCurrentBrasiliaDateKeySync();
  const initialFrom = shiftBrasiliaDateKeyByDays(initialTo, -30);

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<typeof data | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [preparingDemo, setPreparingDemo] = useState(false);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [eventOperations, setEventOperations] = useState<EventOperationsData | null>(null);
  const [attendancePage, setAttendancePage] = useState(1);
  const [absencesPage, setAbsencesPage] = useState(1);
  const [deniedPage, setDeniedPage] = useState(1);

  const current = liveData || data;
  const activeEventId = selectedEventId && selectedEventId !== "__all__" ? selectedEventId : undefined;

  const refreshOperations = async (
    eventId: string,
    nextAttendancePage = attendancePage,
    nextAbsencesPage = absencesPage,
    nextDeniedPage = deniedPage,
  ) => {
    setOperationsLoading(true);
    try {
      const result = await loadOperations(eventId, nextAttendancePage, nextAbsencesPage, nextDeniedPage);
      setEventOperations(result);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao carregar operação do evento");
    } finally {
      setOperationsLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await loadDashboard(from, to, activeEventId);
      setLiveData(result);
      if (activeEventId) {
        await refreshOperations(activeEventId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Always refetch on mount (so navigating back shows fresh data)
  // and auto-refresh every 30s while the dashboard is open.
  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      refresh();
    }, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Force loader re-run when window regains focus
  useEffect(() => {
    const onFocus = () => router.invalidate();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  const handleEventFilter = async (eventId: string) => {
    setSelectedEventId(eventId);
    setAttendancePage(1);
    setAbsencesPage(1);
    setDeniedPage(1);
    if (!eventId || eventId === "__all__") {
      setEventOperations(null);
    }
    setLoading(true);
    try {
      const eid = eventId && eventId !== "__all__" ? eventId : undefined;
      const result = await loadDashboard(from, to, eid);
      setLiveData(result);
      if (eid) {
        const operations = await loadOperations(eid, 1, 1, 1);
        setEventOperations(operations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const checkins = await getCheckinsForExport({ data: { from, to, event_id: activeEventId } });

      const header = ["Nome", "Tag", "Evento", "Período", "Tipo de Acesso", "Data", "Hora"].join(",");
      const rows = checkins.map((c: any) => {
        const p = c.people as { name: string; tag: string | null } | null;
        const date = c.date || "";
        const time = c.checked_in_at
          ? new Date(c.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : "";
        const fields = [
          p?.name || "",
          p?.tag || "",
          c.event_name || "",
          c.period || "",
          c.access_type || "",
          date,
          time,
        ];
        return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");
      });

      const csv = [header, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fileName = `checkins_${from}_${to}${activeEventId ? `_evento` : ""}.csv`;
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handlePrepareDemo = async () => {
    setPreparingDemo(true);
    try {
      const demo = await prepareHouseDemoAction();
      setFrom(demo.event.date);
      setTo(demo.event.date);
      setSelectedEventId(demo.event.id);
      setAttendancePage(1);
      setAbsencesPage(1);
      setDeniedPage(1);

      const [dashboard, operations] = await Promise.all([
        loadDashboard(demo.event.date, demo.event.date, demo.event.id),
        loadOperations(demo.event.id, 1, 1, 1),
      ]);

      setLiveData(dashboard as DashboardData);
      setEventOperations(operations);
      toast.success("Demo preparada", {
        description: "O evento Demo Test foi recriado e está pronto para replay.",
      });
      router.invalidate();
    } catch (err) {
      console.error(err);
      toast.error("Falha ao preparar demo");
    } finally {
      setPreparingDemo(false);
    }
  };

  const activeEvent = current.events.find((event: { id: string }) => event.id === activeEventId) || null;

  const kpis = [
    {
      label: "Total Check-ins",
      value: current.stats.totalCheckins,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pessoas Únicas",
      value: current.stats.uniquePeople,
      icon: Users,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Arquitetos Ativos",
      value: current.stats.architects,
      icon: HardHat,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm mt-1">Visão geral do evento</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40 rounded-xl bg-background/60"
            />
            <span className="text-muted-foreground">→</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40 rounded-xl bg-background/60"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
              disabled={loading}
              className="rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              onClick={handlePrepareDemo}
              disabled={preparingDemo}
              className="rounded-xl gap-2"
            >
              <PlayCircle className={`w-4 h-4 ${preparingDemo ? "animate-pulse" : ""}`} />
              {preparingDemo ? "Preparando demo..." : "Preparar Demo Test"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="rounded-xl gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exportando..." : "Exportar CSV"}
            </Button>
          </div>
        </div>

        {/* Event filter */}
        {current.events.length > 0 && (
          <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-muted-foreground shrink-0">Filtrar por evento:</span>
            <Select value={selectedEventId || "__all__"} onValueChange={handleEventFilter}>
              <SelectTrigger className="w-80 rounded-xl bg-background/50">
                <SelectValue placeholder="Todos os eventos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os eventos</SelectItem>
                {current.events.map((e: { id: string; name: string; date: string }) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.date} — {e.name}{e.name === "Demo Test" ? " [demo]" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeEventId && (
              <Badge className="bg-primary/10 text-primary border-0 rounded-lg text-xs">
                Filtrado por evento
              </Badge>
            )}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="glass rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-0 rounded-lg">Demo resetável</Badge>
              <Badge variant="secondary" className="rounded-lg">sem LUMA_API_KEY</Badge>
            </div>
            <h3 className="text-lg font-semibold">Fluxo de demonstração casa/porta</h3>
            <p className="text-sm text-muted-foreground">
              Use o botão de preparo para recriar o evento fixo, os guests fake do Luma e os residentes locais.
              Depois rode o simulador da casa e da porta para materializar presentes, ausentes e negados.
            </p>
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="rounded-2xl bg-background/50 px-4 py-3">1. Preparar demo no dashboard</div>
              <div className="rounded-2xl bg-background/50 px-4 py-3">2. Casa faz bootstrap do feed</div>
              <div className="rounded-2xl bg-background/50 px-4 py-3">3. Porta lê QR guest válido</div>
              <div className="rounded-2xl bg-background/50 px-4 py-3">4. Porta lê residente válido</div>
              <div className="rounded-2xl bg-background/50 px-4 py-3">5. Porta lê QR inválido</div>
              <div className="rounded-2xl bg-background/50 px-4 py-3">6. Dashboard mostra presentes, ausentes e negados</div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 space-y-3">
            <h3 className="text-lg font-semibold">Evento ativo</h3>
            {activeEvent ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary/10 text-primary border-0 rounded-lg">{activeEvent.name}</Badge>
                  {activeEvent.name === "Demo Test" && (
                    <Badge variant="secondary" className="rounded-lg">house-door-demo-v1</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activeEvent.date}</p>
                <p className="text-sm text-muted-foreground">
                  Selecione um evento para abrir a visão operacional com roster, ausências e negados.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Filtre por um evento para abrir a operação detalhada. O Demo Test aparece automaticamente após o preparo.
              </p>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-5">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="glass rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{kpi.label}</p>
                  <p className={`text-4xl font-bold mt-2 ${kpi.color}`}>{kpi.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 glass rounded-3xl p-6">
            <h3 className="text-base font-semibold mb-4">Presença Diária</h3>
            {current.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={current.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 245)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "oklch(0.50 0.02 250)" }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.50 0.02 250)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.99 0.003 240)",
                      border: "1px solid oklch(0.88 0.01 245)",
                      borderRadius: 12,
                      color: "oklch(0.18 0.02 260)",
                      boxShadow: "0 4px 16px oklch(0.5 0.02 250 / 8%)",
                    }}
                  />
                  <Bar dataKey="count" fill="oklch(0.72 0.19 135)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-16">
                Sem dados no período
              </p>
            )}
          </div>

          <div className="glass rounded-3xl p-6">
            <h3 className="text-base font-semibold mb-4">Tipo de Acesso</h3>
            {current.breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={current.breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {current.breakdown.map((_: { name: string; value: number }, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.99 0.003 240)",
                      border: "1px solid oklch(0.88 0.01 245)",
                      borderRadius: 12,
                      color: "oklch(0.18 0.02 260)",
                      boxShadow: "0 4px 16px oklch(0.5 0.02 250 / 8%)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-16">
                Sem dados
              </p>
            )}
          </div>
        </div>

        {/* Top attendees */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-base font-semibold mb-4">Ranking de Frequência</h3>
          {current.topPeople.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Check-ins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.topPeople.map((p: { name: string; tag: string | null; count: number }, i: number) => (
                  <TableRow key={`${p.name}-${i}`}>
                    <TableCell className="font-mono text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {p.tag && (
                        <Badge className="text-xs rounded-lg bg-primary/10 text-primary border-0 font-medium">
                          {p.tag}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">{p.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">Sem dados no período</p>
          )}
        </div>

        {activeEventId && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-xl font-semibold">Operação do evento</h3>
                <p className="text-sm text-muted-foreground">
                  Presentes materializados, ausentes do roster e logs brutos de acessos negados.
                </p>
              </div>
              {operationsLoading && <Badge variant="secondary" className="rounded-lg">Atualizando...</Badge>}
            </div>

            {eventOperations && (
              <>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Inscritos",
                      value: eventOperations.summary.registrations,
                      icon: Users,
                      tone: "text-foreground bg-muted/40",
                    },
                    {
                      label: "Presentes",
                      value: eventOperations.summary.attendees,
                      icon: UserCheck,
                      tone: "text-primary bg-primary/10",
                    },
                    {
                      label: "Ausentes",
                      value: eventOperations.summary.absences,
                      icon: UserX,
                      tone: "text-amber-500 bg-amber-500/10",
                    },
                    {
                      label: "Negados",
                      value: eventOperations.summary.denied,
                      icon: ShieldX,
                      tone: "text-red-500 bg-red-500/10",
                    },
                  ].map((item) => (
                    <div key={item.label} className="glass rounded-3xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">{item.label}</p>
                          <p className="text-4xl font-bold mt-2">{item.value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.tone}`}>
                          <item.icon className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-3">
                  <div className="glass rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold">Presentes</h4>
                      <Badge className="bg-primary/10 text-primary border-0 rounded-lg">
                        {eventOperations.attendees.total}
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventOperations.attendees.items.map((person) => (
                          <TableRow key={person.checkin_id}>
                            <TableCell>
                              <div className="font-medium">{person.name}</div>
                              {person.tag && <div className="text-xs text-muted-foreground">{person.tag}</div>}
                            </TableCell>
                            <TableCell>{person.access_type}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {new Date(person.checked_in_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {eventOperations.attendees.items.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma presença materializada.</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={attendancePage <= 1 || operationsLoading}
                        onClick={() => {
                          const nextPage = attendancePage - 1;
                          setAttendancePage(nextPage);
                          refreshOperations(activeEventId, nextPage, absencesPage, deniedPage);
                        }}
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Página {eventOperations.attendees.page} de {eventOperations.attendees.total_pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={attendancePage >= eventOperations.attendees.total_pages || operationsLoading}
                        onClick={() => {
                          const nextPage = attendancePage + 1;
                          setAttendancePage(nextPage);
                          refreshOperations(activeEventId, nextPage, absencesPage, deniedPage);
                        }}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>

                  <div className="glass rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold">Ausentes / no-show</h4>
                      <Badge className="bg-amber-500/10 text-amber-500 border-0 rounded-lg">
                        {eventOperations.absences.total}
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventOperations.absences.items.map((person) => (
                          <TableRow key={person.person_id}>
                            <TableCell className="font-medium">{person.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{person.tag || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {eventOperations.absences.items.length === 0 && (
                      <p className="text-sm text-muted-foreground">Todos os inscritos compareceram.</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={absencesPage <= 1 || operationsLoading}
                        onClick={() => {
                          const nextPage = absencesPage - 1;
                          setAbsencesPage(nextPage);
                          refreshOperations(activeEventId, attendancePage, nextPage, deniedPage);
                        }}
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Página {eventOperations.absences.page} de {eventOperations.absences.total_pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={absencesPage >= eventOperations.absences.total_pages || operationsLoading}
                        onClick={() => {
                          const nextPage = absencesPage + 1;
                          setAbsencesPage(nextPage);
                          refreshOperations(activeEventId, attendancePage, nextPage, deniedPage);
                        }}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>

                  <div className="glass rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold">Acessos negados</h4>
                      <Badge className="bg-red-500/10 text-red-500 border-0 rounded-lg">
                        {eventOperations.denied.total}
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Momento</TableHead>
                          <TableHead>Credencial</TableHead>
                          <TableHead>Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventOperations.denied.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(item.occurred_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.credential_type}</div>
                              <div className="text-xs text-muted-foreground">{item.house_user_id || item.person_name || "sem vínculo"}</div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.reason || item.resolution_status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {eventOperations.denied.items.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum denied registrado.</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deniedPage <= 1 || operationsLoading}
                        onClick={() => {
                          const nextPage = deniedPage - 1;
                          setDeniedPage(nextPage);
                          refreshOperations(activeEventId, attendancePage, absencesPage, nextPage);
                        }}
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Página {eventOperations.denied.page} de {eventOperations.denied.total_pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deniedPage >= eventOperations.denied.total_pages || operationsLoading}
                        onClick={() => {
                          const nextPage = deniedPage + 1;
                          setDeniedPage(nextPage);
                          refreshOperations(activeEventId, attendancePage, absencesPage, nextPage);
                        }}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
