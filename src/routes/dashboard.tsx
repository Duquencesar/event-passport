import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, HardHat, TrendingUp, RefreshCw } from "lucide-react";
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
} from "@/server/dashboard.functions";

const loadDashboard = async (from: string, to: string) => {
  const [stats, daily, breakdown, topPeople] = await Promise.all([
    getDashboardStats({ data: { from, to } }),
    getDailyAttendance({ data: { from, to } }),
    getAccessTypeBreakdown({ data: { from, to } }),
    getTopAttendees({ data: { from, to } }),
  ]);
  return { stats, daily, breakdown, topPeople };
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
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const from = deps.from || thirtyDaysAgo.toISOString().split("T")[0];
    const to = deps.to || today.toISOString().split("T")[0];
    return loadDashboard(from, to);
  },
  component: DashboardPage,
});

const PIE_COLORS = [
  "oklch(0.89 0.2 110)",
  "oklch(0.65 0.12 230)",
  "oklch(0.75 0.15 180)",
  "oklch(0.80 0.18 85)",
];

function DashboardPage() {
  const data = Route.useLoaderData();
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [from, setFrom] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [to, setTo] = useState(today.toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<typeof data | null>(null);

  const current = liveData || data;

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await loadDashboard(from, to);
      setLiveData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40 bg-card"
            />
            <span className="text-muted-foreground">→</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40 bg-card"
            />
            <Button size="sm" variant="secondary" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Check-ins",
              value: current.stats.totalCheckins,
              icon: TrendingUp,
              color: "text-primary",
            },
            {
              label: "Pessoas Únicas",
              value: current.stats.uniquePeople,
              icon: Users,
              color: "text-secondary",
            },
            {
              label: "Arquitetos Ativos",
              value: current.stats.architects,
              icon: HardHat,
              color: "text-chart-3",
            },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                  </div>
                  <kpi.icon className={`w-8 h-8 ${kpi.color} opacity-40`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Presença Diária</CardTitle>
            </CardHeader>
            <CardContent>
              {current.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={current.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "oklch(0.65 0.02 250)" }}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "oklch(0.65 0.02 250)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.185 0.025 255)",
                        border: "1px solid oklch(1 0 0 / 10%)",
                        borderRadius: 8,
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="oklch(0.89 0.2 110)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-12">
                  Sem dados no período
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Tipo de Acesso</CardTitle>
            </CardHeader>
            <CardContent>
              {current.breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={current.breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {current.breakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.185 0.025 255)",
                        border: "1px solid oklch(1 0 0 / 10%)",
                        borderRadius: 8,
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-12">
                  Sem dados
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top attendees */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Ranking de Frequência</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {current.topPeople.map((p, i) => (
                    <TableRow key={p.email}>
                      <TableCell className="font-mono text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                      <TableCell>
                        {p.tag && (
                          <Badge variant="secondary" className="text-xs">
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
              <p className="text-muted-foreground text-sm text-center py-8">Sem dados no período</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
