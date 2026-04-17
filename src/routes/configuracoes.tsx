import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Send,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  CalendarDays,
} from "lucide-react";
import { getTelegramConfig, saveTelegramConfig } from "@/server/people.functions";
import { sendDailyReport } from "@/server/telegram-report.functions";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Ipê Village - Configurações" },
      { name: "description", content: "Configurações do sistema Ipê Village" },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [appUrl, setAppUrl]     = useState("");
  const [secret, setSecret]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [testPeriod, setTestPeriod] = useState<"morning" | "afternoon">("morning");
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; sent?: number; error?: string } | null>(null);

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
      setTimeout(() => setSaved(false), 3000);
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
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Integrações e automações do sistema
          </p>
        </div>

        {/* Telegram Cron */}
        <div className="glass rounded-3xl p-6 space-y-5 border border-border/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Relatório Telegram automático</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Dispara relatório de check-ins ao meio-dia e às 18h, dias úteis, via Supabase pg_cron.
              </p>
            </div>
          </div>

          {/* Schedule info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { time: "12:00 BRT", label: "Relatório Manhã", emoji: "🌅", cron: "0 15 * * 1-5" },
              { time: "18:00 BRT", label: "Relatório Tarde",  emoji: "🌇", cron: "0 21 * * 1-5" },
            ].map((s) => (
              <div key={s.time} className="glass-subtle rounded-2xl px-4 py-3 flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{s.emoji} {s.time}</p>
                  <p className="text-xs text-muted-foreground font-mono">{s.cron}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-sm">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 text-muted-foreground">
              <p>
                O pg_cron chama <code className="text-xs bg-muted/40 px-1 py-0.5 rounded font-mono">POST {"{app_url}"}/hooks/telegram-daily-report</code> com o secret como Bearer token.
              </p>
              <p>Configure a <strong className="text-foreground">URL do app</strong> (ex: <code className="text-xs bg-muted/40 px-1 py-0.5 rounded font-mono">https://seu-app.lovable.app</code>) e um <strong className="text-foreground">secret</strong> de sua escolha.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-10 rounded-xl bg-muted/20 animate-pulse" />
              <div className="h-10 rounded-xl bg-muted/20 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">URL do app</label>
                <Input
                  placeholder="https://seu-app.lovable.app"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  className="rounded-xl bg-background/50 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Secret do cron</label>
                <Input
                  type="password"
                  placeholder="qualquer string aleatória segura"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="rounded-xl bg-background/50 font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl"
                >
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                  {saving ? "Salvando..." : "Salvar configuração"}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Salvo!
                  </span>
                )}
                {saveError && (
                  <span className="flex items-center gap-1.5 text-sm text-red-400">
                    <AlertTriangle className="w-4 h-4" /> {saveError}
                  </span>
                )}
              </div>

              {updatedAt && (
                <p className="text-xs text-muted-foreground/60">
                  Última atualização: {new Date(updatedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Test report */}
        <div className="glass rounded-3xl p-6 space-y-4 border border-border/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Testar relatório agora</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Envia o relatório imediatamente para todos os chats registrados no bot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-xl border border-border/40 overflow-hidden">
              {(["morning", "afternoon"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setTestPeriod(p)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    testPeriod === p
                      ? "bg-primary/15 text-primary"
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
              className="rounded-xl"
            >
              {testing
                ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                : <><Send className="w-4 h-4 mr-2" />Enviar agora</>}
            </Button>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
              testResult.ok
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}>
              {testResult.ok
                ? <><CheckCircle className="w-4 h-4 shrink-0" /> Relatório enviado para {testResult.sent} chat(s).</>
                : <><AlertTriangle className="w-4 h-4 shrink-0" /> {testResult.error}</>}
            </div>
          )}
        </div>

        {/* Access types reference */}
        <div className="glass rounded-3xl p-6 space-y-4 border border-border/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Tipos de acesso</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Regras de acesso por categoria de ingresso</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { tag: "Arquiteto",  color: "text-amber-400",  desc: "Acesso total a todos os eventos. Sem restrição de data." },
              { tag: "Explorer",   color: "text-sky-400",    desc: "Acesso total a todos os eventos. Sem restrição de data." },
              { tag: "Weekly",     color: "text-violet-400", desc: "Acesso a todos os eventos dentro da semana definida (7 dias a partir da data de início)." },
              { tag: "Day Pass",   color: "text-emerald-400",desc: "Acesso apenas no dia definido no campo 'day_pass_date' da inscrição." },
              { tag: "Geral",      color: "text-muted-foreground", desc: "Acesso somente ao evento específico em que está inscrito." },
            ].map((r) => (
              <div key={r.tag} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-muted/10">
                <Badge className="bg-transparent border-0 p-0 shrink-0">
                  <span className={`font-semibold text-xs ${r.color}`}>{r.tag}</span>
                </Badge>
                <p className="text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
