import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { SectionBadge } from "@/components/SectionBadge";
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
import {
  Send,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getTelegramConfig, saveTelegramConfig } from "@/server/people.functions";
import { sendDailyReport } from "@/server/telegram-report.functions";
import { lumaSyncAll } from "@/server/luma.functions";
import { getLastLumaSync } from "@/server/luma-status.functions";
import { RefreshCw as RefreshIcon } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Ipê Village" },
      { name: "description", content: "Configurações do sistema Ipê Village" },
    ],
  }),
  component: ConfiguracoesPage,
});

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-background/40 px-3 py-2">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

const ACCESS_TYPES = [
  {
    tipo: "Arquiteto",
    descricao: "Associado sênior — acesso total",
    acesso: "Permitido",
    accessType: "ok" as const,
    color: "text-amber-400",
    dot: "bg-amber-400",
  },
  {
    tipo: "Explorer",
    descricao: "Membro explorador — acesso total",
    acesso: "Permitido",
    accessType: "ok" as const,
    color: "text-sky-400",
    dot: "bg-sky-400",
  },
  {
    tipo: "Weekly",
    descricao: "Passe semanal — 7 dias a partir da data de início",
    acesso: "Condicional",
    accessType: "warning" as const,
    color: "text-violet-400",
    dot: "bg-violet-400",
  },
  {
    tipo: "Day Pass",
    descricao: "Acesso apenas no dia definido na inscrição",
    acesso: "Condicional",
    accessType: "warning" as const,
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  {
    tipo: "Geral",
    descricao: "Inscrito no evento específico somente",
    acesso: "Restrito",
    accessType: "danger" as const,
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
] as const;

function ConfiguracoesPage() {
  const [appUrl, setAppUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [testPeriod, setTestPeriod] = useState<"morning" | "afternoon">("morning");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; sent?: number; error?: string } | null>(null);

  // Luma sync
  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const sevenDaysKey = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const yearStartKey = `${new Date().getFullYear()}-01-01`;

  const [syncFrom, setSyncFrom] = useState(todayKey);
  const [syncTo, setSyncTo] = useState(sevenDaysKey);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<
    | { ok: true; eventsInRange: number; totals: { guests: number; created: number; registrations: number; checkins: number } }
    | { ok: false; error: string }
    | null
  >(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    getLastLumaSync().then((r: any) => setLastSync(r?.last_sync || null)).catch(() => {});
  }, []);

  const handleSyncLuma = async () => {
    if (syncTo < syncFrom) {
      setSyncResult({ ok: false, error: "Data final não pode ser anterior à inicial." });
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const r = await lumaSyncAll({ data: { since_date: syncFrom, until_date: syncTo } });
      // Filtra os eventos efetivamente dentro do intervalo (lumaSyncAll inclui tudo a partir de since_date)
      const inRange = (r as any).per_event.filter(
        (e: { date: string }) => e.date >= syncFrom && e.date <= syncTo,
      );
      const totals = inRange.reduce(
        (acc: any, e: any) => ({
          guests: acc.guests + (e.total_guests > 0 ? e.total_guests : 0),
          created: acc.created + e.created,
          registrations: acc.registrations + e.registrations,
          checkins: acc.checkins + e.checkins,
        }),
        { guests: 0, created: 0, registrations: 0, checkins: 0 },
      );
      setSyncResult({ ok: true, eventsInRange: inRange.length, totals });
      setLastSync(new Date().toISOString());
    } catch (err: any) {
      setSyncResult({ ok: false, error: err?.message || "Erro ao sincronizar" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    getTelegramConfig().then((cfg: any) => {
      setAppUrl(cfg.app_url || "");
      setSecret(cfg.cron_secret || "");
      setUpdatedAt(cfg.updated_at || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      await saveTelegramConfig({ data: { app_url: appUrl.trim(), cron_secret: secret.trim() } });
      setSaved(true);
      setUpdatedAt(new Date().toISOString());
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setSaveError(err?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleTestReport = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendDailyReport({ data: { period: testPeriod } });
      setTestResult({ ok: true, sent: (result as any).sent });
    } catch (err: any) {
      setTestResult({ ok: false, error: err?.message || "Erro ao enviar" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-2xl fade-up">
        {/* Page header */}
        <div>
          <SectionBadge label="ADMINISTRAÇÃO" pulse={false} className="mb-3" />
          <h1
            className="gradient-text"
            style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: "1.1" }}
          >
            Configurações
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Integrações e automações do sistema</p>
        </div>

        {/* Luma sync */}
        <div className="glass rounded-3xl p-6 space-y-5 border border-border/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
              <RefreshIcon className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Sincronizar com Luma</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Importa eventos, inscritos e check-ins do calendário Luma para o intervalo de datas selecionado.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">De</label>
              <Input
                type="date"
                value={syncFrom}
                onChange={(e) => setSyncFrom(e.target.value)}
                className="rounded-xl bg-background/50 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Até</label>
              <Input
                type="date"
                value={syncTo}
                onChange={(e) => setSyncTo(e.target.value)}
                className="rounded-xl bg-background/50 font-mono text-sm"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Próximos 7 dias", from: todayKey, to: sevenDaysKey },
              { label: "Hoje", from: todayKey, to: todayKey },
              { label: "Ano todo", from: yearStartKey, to: `${new Date().getFullYear()}-12-31` },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => { setSyncFrom(preset.from); setSyncTo(preset.to); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-muted-foreground"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSyncLuma} disabled={syncing} className="rounded-xl">
              {syncing
                ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Sincronizando…</>
                : <><RefreshCw className="w-4 h-4 mr-2" />Sincronizar agora</>}
            </Button>
            {lastSync && (
              <span className="text-xs text-muted-foreground/70">
                Última sync: {new Date(lastSync).toLocaleString("pt-BR")}
              </span>
            )}
          </div>

          {syncResult && syncResult.ok && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                Sincronização concluída
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Eventos no intervalo" value={syncResult.eventsInRange} />
                <Stat label="Inscritos lidos" value={syncResult.totals.guests} />
                <Stat label="Pessoas novas" value={syncResult.totals.created} />
                <Stat label="Inscrições novas" value={syncResult.totals.registrations} />
                <Stat label="Check-ins novos" value={syncResult.totals.checkins} />
              </div>
              <p className="text-xs text-muted-foreground/70">
                Intervalo: {new Date(syncFrom + "T12:00:00").toLocaleDateString("pt-BR")} → {new Date(syncTo + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}

          {syncResult && !syncResult.ok && (
            <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {syncResult.error}
            </div>
          )}
        </div>

        {/* Telegram Cron card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5 fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="space-y-1">
            <SectionBadge label="TELEGRAM" pulse={false} />
            <h2
              className="mt-3 text-xl text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Relatório automático
            </h2>
            <p className="text-sm text-muted-foreground">
              Dispara relatório de check-ins ao meio-dia e às 18h, dias úteis, via Supabase pg_cron.
            </p>
          </div>

          {/* Schedule info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { time: "12:00 BRT", label: "Relatório Manhã", emoji: "🌅", cron: "0 15 * * 1-5" },
              { time: "18:00 BRT", label: "Relatório Tarde", emoji: "🌇", cron: "0 21 * * 1-5" },
            ].map((s) => (
              <div key={s.time} className="rounded-xl border border-border bg-background/40 px-4 py-3 flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{s.emoji} {s.time}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{s.cron}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0052FF]/5 border border-[#0052FF]/15 text-sm">
            <Info className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
            <div className="space-y-1 text-muted-foreground">
              <p>
                O pg_cron chama{" "}
                <code className="text-xs bg-muted/40 px-1 py-0.5 rounded font-mono">
                  POST {"{app_url}"}/hooks/telegram-daily-report
                </code>{" "}
                com o secret como Bearer token.
              </p>
              <p>
                Configure a <strong className="text-foreground">URL do app</strong> e um{" "}
                <strong className="text-foreground">secret</strong> de sua escolha.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
              <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="app-url">
                  URL do app
                </label>
                <Input
                  id="app-url"
                  placeholder="https://seu-app.lovable.app"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  className="h-12 rounded-xl bg-background/60 font-mono text-sm"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">Endereço público do sistema (ex: seu domínio Lovable)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="cron-secret">
                  Secret do cron
                </label>
                <div className="relative">
                  <Input
                    id="cron-secret"
                    type={showSecret ? "text" : "password"}
                    placeholder="qualquer string aleatória segura"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    className="h-12 rounded-xl bg-background/60 font-mono text-sm pr-12"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    aria-label={showSecret ? "Ocultar secret" : "Mostrar secret"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Usado como Bearer token no header Authorization</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 px-5 rounded-xl"
                  aria-label="Salvar configurações do Telegram"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Salvar configurações
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400" aria-live="polite">
                    <CheckCircle className="w-4 h-4" />
                    Configurações salvas
                    {updatedAt && (
                      <span className="text-xs text-muted-foreground ml-1">
                        às {new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </span>
                )}

                {saveError && (
                  <span className="flex items-center gap-1.5 text-sm text-destructive" aria-live="polite">
                    <AlertTriangle className="w-4 h-4" />
                    {saveError}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Test report card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="space-y-1">
            <SectionBadge label="TESTE" pulse={false} />
            <h2
              className="mt-3 text-xl text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Testar relatório agora
            </h2>
            <p className="text-sm text-muted-foreground">
              Envia o relatório imediatamente para todos os chats registrados no bot.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-xl border border-border/60 overflow-hidden bg-background/40">
              {(["morning", "afternoon"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTestPeriod(p)}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                    testPeriod === p
                      ? "bg-[#0052FF]/15 text-[#0052FF]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "morning" ? "🌅 Manhã" : "🌇 Tarde"}
                </button>
              ))}
            </div>

            <Button
              onClick={handleTestReport}
              disabled={testing}
              variant="outline"
              className="h-11 px-5 rounded-xl gap-2"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar agora
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <div
              aria-live="polite"
              className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
                testResult.ok
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-destructive/10 border border-destructive/20 text-destructive"
              }`}
            >
              {testResult.ok ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Relatório enviado para {testResult.sent} chat(s) com sucesso.
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {testResult.error}
                </>
              )}
            </div>
          )}
        </div>

        {/* Access types reference table */}
        <div
          className="rounded-xl border border-border bg-card overflow-hidden fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="p-6 pb-4 space-y-1">
            <SectionBadge label="TIPOS DE ACESSO" pulse={false} />
            <h2
              className="mt-3 text-xl text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Referência de tipos de acesso
            </h2>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent" style={{ backgroundColor: "oklch(0.10 0.02 265)" }}>
                  <TableHead className="text-xs font-mono uppercase tracking-[0.12em] text-muted-foreground">Tipo</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-[0.12em] text-muted-foreground">Descrição</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-[0.12em] text-muted-foreground">Acesso check-in</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-[0.12em] text-muted-foreground">Cor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ACCESS_TYPES.map((row) => (
                  <TableRow
                    key={row.tipo}
                    className="border-border hover:bg-[#0052FF]/3 transition-colors duration-150"
                  >
                    <TableCell className="font-semibold text-sm">
                      <span className={row.color}>{row.tipo}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.descricao}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {row.accessType === "ok" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : row.accessType === "warning" ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        )}
                        <span className={
                          row.accessType === "ok"
                            ? "text-emerald-400"
                            : row.accessType === "warning"
                              ? "text-amber-400"
                              : "text-red-400"
                        }>
                          {row.acesso}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} />
                        <span className={row.color}>{row.tipo}</span>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
