import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Users, HardHat, TrendingUp, RefreshCw, Download, CalendarDays } from "lucide-react";
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
} from "@/server/dashboard.functions";

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
  const initialTo = getCurrentBrasiliaDateKeySync();
  const initialFrom = shiftBrasiliaDateKeyByDays(initialTo, -30);

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<typeof data | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const current = liveData || data;
  const activeEventId = selectedEventId && selectedEventId !== "__all__" ? selectedEventId : undefined;

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await loadDashboard(from, to, activeEventId);
      setLiveData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventFilter = async (eventId: string) => {
    setSelectedEventId(eventId);
    setLoading(true);
    try {
      const eid = eventId && eventId !== "__all__" ? eventId : undefined;
      const result = await loadDashboard(from, to, eid);
      setLiveData(result);
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

      const header = ["Nome", "Email", "Tag", "Evento", "Período", "Tipo de Acesso", "Data", "Hora"].join(",");
      const rows = checkins.map((c: any) => {
        const p = c.people as { name: string; email: string; tag: string | null } | null;
        const date = c.date || "";
        const time = c.checked_in_at
          ? new Date(c.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : "";
        const fields = [
          p?.name || "",
          p?.email || "",
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
                    {e.date} — {e.name}
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
                  <TableHead>Email</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Check-ins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.topPeople.map((p: { name: string; email: string; tag: string | null; count: number }, i: number) => (
                  <TableRow key={p.email}>
                    <TableCell className="font-mono text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
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
      </div>
    </Layout>
  );
}
