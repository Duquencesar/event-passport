import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserCheck, HardHat, TrendingUp } from "lucide-react";
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

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ipê Village Check-In" },
      { name: "description", content: "Analytics do Ipê Village" },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = [
  "oklch(0.89 0.2 110)",
  "oklch(0.65 0.12 230)",
  "oklch(0.75 0.15 180)",
  "oklch(0.80 0.18 85)",
];

function DashboardPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [from, setFrom] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [to, setTo] = useState(today.toISOString().split("T")[0]);
  const [stats, setStats] = useState({ totalCheckins: 0, uniquePeople: 0, architects: 0 });
  const [daily, setDaily] = useState<{ date: string; count: number }[]>([]);
  const [breakdown, setBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [topPeople, setTopPeople] = useState<
    { name: string; email: string; tag: string | null; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, d, b, t] = await Promise.all([
        getDashboardStats({ data: { from, to } }),
        getDailyAttendance({ data: { from, to } }),
        getAccessTypeBreakdown({ data: { from, to } }),
        getTopAttendees({ data: { from, to } }),
      ]);
      setStats(s);
      setDaily(d);
      setBreakdown(b);
      setTopPeople(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [from, to]);

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
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Check-ins",
              value: stats.totalCheckins,
              icon: TrendingUp,
              color: "text-primary",
            },
            {
              label: "Pessoas Únicas",
              value: stats.uniquePeople,
              icon: Users,
              color: "text-secondary",
            },
            {
              label: "Arquitetos Ativos",
              value: stats.architects,
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
              {daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={daily}>
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
              {breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {breakdown.map((_, i) => (
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
            {topPeople.length > 0 ? (
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
                  {topPeople.map((p, i) => (
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
