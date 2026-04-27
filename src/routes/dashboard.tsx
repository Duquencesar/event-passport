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
import { Users, HardHat, RefreshCw, Download, CalendarDays, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getDashboardStats,
  getDailyAttendance,
  getTopAttendees,
  getCheckinsForExport,
  getEventsForDashboard,
} from "@/server/dashboard.functions";
import { SectionBadge } from "@/components/SectionBadge";
import { StatCard } from "@/components/StatCard";

const loadDashboard = async (from: string, to: string, event_id?: string) => {
  const [stats, daily, topPeople, events] = await Promise.all([
    getDashboardStats({ data: { from, to, event_id } }),
    getDailyAttendance({ data: { from, to, event_id } }),
    getTopAttendees({ data: { from, to, event_id } }),
    getEventsForDashboard({ data: { from, to } }),
  ]);
  return { stats, daily, topPeople, events };
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

const CHART_TICK_STYLE = { fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "monospace" };

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

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <SectionBadge label="ANÁLISE" pulse={false} className="mb-3" />
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: "1.1" }}>
              <span className="gradient-text">Dashboard</span>
            </h1>
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

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8 stagger">
          <StatCard
            icon={Activity}
            label="TOTAL CHECK-INS"
            value={current.stats.totalCheckins ?? "—"}
            className="fade-up"
          />
          <StatCard
            icon={Users}
            label="PESSOAS ÚNICAS"
            value={current.stats.uniquePeople ?? "—"}
            className="fade-up"
          />
          <StatCard
            icon={HardHat}
            label="ARQUITETOS ATIVOS"
            value={current.stats.architects ?? "—"}
            className="fade-up"
          />
        </div>

        {/* Presença Diária */}
        <div>
          <div className="rounded-xl border border-border bg-card p-6">
            <SectionBadge label="PRESENÇA DIÁRIA" pulse={false} className="mb-4" />
            {current.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={current.daily}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={CHART_TICK_STYLE}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={CHART_TICK_STYLE} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.99 0.003 240)",
                      border: "1px solid oklch(0.88 0.01 245)",
                      borderRadius: 12,
                      color: "oklch(0.18 0.02 260)",
                      boxShadow: "0 4px 16px oklch(0.5 0.02 250 / 8%)",
                    }}
                  />
                  <Bar dataKey="count" fill="#84E400" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-16">
                Sem dados no período
              </p>
            )}
          </div>
        </div>

        {/* Top attendees */}
        <div className="rounded-xl border border-border bg-card p-6">
          <SectionBadge label="MAIS PRESENTES" pulse={false} className="mb-4" />
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
                {current.topPeople.map((p: { name: string; email?: string; tag: string | null; count: number }, i: number) => (
                  <TableRow
                    key={p.email || `${p.name}-${i}`}
                    className="hover:bg-[#84E400]/5 transition-colors duration-150"
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#0d2a54] to-[#29B6F6] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium">{p.name}</span>
                          {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                        </div>
                      </div>
                    </TableCell>
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
