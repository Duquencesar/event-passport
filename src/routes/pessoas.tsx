import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  Ticket,
  CalendarDays,
  Clock,
  CheckCircle2,
  SortAsc,
  HardHat,
  Compass,
  CreditCard,
  Tag,
} from "lucide-react";
import {
  getPeopleWithRegistrations,
  getPeopleCount,
  setDayPassDate,
  setWeekPassStartDate,
  getPersonCheckinHistory,
  updatePersonTag,
} from "@/server/people.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pessoas")({
  head: () => ({
    meta: [
      { title: "Ipê Village - Inscritos" },
      { name: "description", content: "Lista de inscritos do Ipê Village" },
    ],
  }),
  component: PessoasPage,
});

type PersonWithRegs = {
  id: string;
  name: string;
  tag: string | null;
  created_at: string;
  registrations: Array<{
    id: string;
    event_name: string;
    ticket_type: string;
    source: string;
    imported_at: string;
    day_pass_date: string | null;
    week_pass_start_date: string | null;
  }>;
};

type CheckinRecord = {
  id: string;
  date: string;
  period: string;
  access_type: string;
  event_name: string | null;
  checked_in_at: string;
};

const TAG_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: React.ElementType; border: string }> = {
  Arquiteto: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400", icon: HardHat, border: "border-amber-500/20" },
  Explorer:  { bg: "bg-sky-500/15",   text: "text-sky-400",   dot: "bg-sky-400",   icon: Compass,  border: "border-sky-500/20" },
  "Day Pass":{ bg: "bg-emerald-500/15",text: "text-emerald-400",dot:"bg-emerald-400",icon: CreditCard,border:"border-emerald-500/20"},
  "Weekly":  { bg: "bg-violet-500/15", text: "text-violet-400", dot: "bg-violet-400", icon: CalendarDays, border: "border-violet-500/20" },
};
const DEFAULT_TAG = { bg: "bg-muted/30", text: "text-muted-foreground", dot: "bg-muted-foreground", icon: Tag, border: "border-border/30" };

function getTagConfig(tag: string | null) {
  return tag ? (TAG_CONFIG[tag] || DEFAULT_TAG) : DEFAULT_TAG;
}

/** Iniciais do nome para avatar */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type SortKey = "name_asc" | "name_desc" | "recent" | "regs_desc";

function PessoasPage() {
  const [people, setPeople] = useState<PersonWithRegs[]>([]);
  const [totalCount, setTotalCount] = useState({ total: 0, checkedIn: 0 });
  const [filter, setFilter] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedPerson, setSelectedPerson] = useState<PersonWithRegs | null>(null);
  const [checkinHistory, setCheckinHistory] = useState<CheckinRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editTag, setEditTag] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, count] = await Promise.all([
        getPeopleWithRegistrations(),
        getPeopleCount(),
      ]);
      setPeople(data as PersonWithRegs[]);
      setTotalCount(count);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar inscritos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  // Realtime: recarrega lista quando novas pessoas/inscrições chegam (ex: sync do Luma)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => { load(); }, 800);
    };

    const channel = supabase
      .channel("pessoas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "people" }, debouncedReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, debouncedReload)
      .subscribe();

    return () => {
      if (timeout) clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [load]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const p of people) { if (p.tag) set.add(p.tag); }
    return Array.from(set).sort();
  }, [people]);

  // Tag stats
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const p of people) {
      const k = p.tag || "__none__";
      stats[k] = (stats[k] || 0) + 1;
    }
    return stats;
  }, [people]);

  const filtered = useMemo(() => {
    let list = people.filter((p) => {
      if (tagFilter === "__none__" && p.tag) return false;
      if (tagFilter && tagFilter !== "__none__" && p.tag !== tagFilter) return false;
      if (filter.length >= 2) {
        const q = filter.toLowerCase();
        return p.name.toLowerCase().includes(q);
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "name_asc")  return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "name_desc") return b.name.localeCompare(a.name, "pt-BR");
      if (sort === "recent")    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "regs_desc") return b.registrations.length - a.registrations.length;
      return 0;
    });

    return list;
  }, [people, filter, tagFilter, sort]);

  const openProfile = async (person: PersonWithRegs) => {
    setSelectedPerson(person);
    setEditTag(person.tag || "");
    setCheckinHistory([]);
    setHistoryLoading(true);
    try {
      const history = await getPersonCheckinHistory({ data: { person_id: person.id } });
      setCheckinHistory(history as CheckinRecord[]);
    } catch {
      setCheckinHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveTag = async () => {
    if (!selectedPerson) return;
    setSavingTag(true);
    try {
      const newTag = editTag && editTag !== "__none__" ? editTag : "";
      await updatePersonTag({ data: { person_id: selectedPerson.id, tag: newTag } });
      setPeople((prev) => prev.map((p) => p.id === selectedPerson.id ? { ...p, tag: newTag || null } : p));
      setSelectedPerson((prev) => prev ? { ...prev, tag: newTag || null } : null);
    } finally {
      setSavingTag(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inscritos</h2>
            <p className="text-muted-foreground text-sm mt-1">Pessoas cadastradas no sistema</p>
          </div>
          <div className="flex items-center gap-4">
            {totalCount.checkedIn > 0 && (
              <div className="glass-strong rounded-2xl px-5 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{totalCount.checkedIn}</span>
                <span className="text-sm text-muted-foreground">passaram</span>
              </div>
            )}
            <div className="glass-strong rounded-2xl px-5 py-3 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{totalCount.total}</span>
              <span className="text-sm text-muted-foreground">inscritos</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && people.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { tag: "Arquiteto", label: "Arquitetos" },
              { tag: "Explorer",  label: "Explorers" },
              { tag: "Day Pass",  label: "Day Pass" },
              { tag: "Weekly",    label: "Weekly" },
              { tag: "__none__",  label: "Sem tag" },
            ].map(({ tag, label }) => {
              const cfg = getTagConfig(tag === "__none__" ? null : tag);
              const count = tagStats[tag] || 0;
              const Icon = cfg.icon;
              return (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={`glass-subtle rounded-2xl p-4 flex items-center gap-3 transition-all hover:bg-white/[0.05] text-left ${tagFilter === tag ? `border ${cfg.border}` : "border border-transparent"}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.text}`} />
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${cfg.text}`}>{count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-12 h-12 rounded-2xl border-border/40 bg-background/60 focus:bg-background/80 transition-colors"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="rounded-2xl bg-background/60 border-border/40 h-12 w-auto sm:w-52 gap-2">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Nome A→Z</SelectItem>
              <SelectItem value="name_desc">Nome Z→A</SelectItem>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="regs_desc">Mais inscrições</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tag filter pills */}
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          <Button
            size="sm"
            variant={tagFilter === null ? "default" : "outline"}
            onClick={() => setTagFilter(null)}
            className="rounded-xl text-xs px-4"
          >
            Todos ({people.length})
          </Button>
          {tags.map((tag) => {
            const cfg = getTagConfig(tag);
            const count = tagStats[tag] || 0;
            return (
              <Button
                key={tag}
                size="sm"
                variant={tagFilter === tag ? "default" : "outline"}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className="rounded-xl text-xs px-4"
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dot} mr-1.5`} />
                {tag} ({count})
              </Button>
            );
          })}
          {(tagStats["__none__"] || 0) > 0 && (
            <Button
              size="sm"
              variant={tagFilter === "__none__" ? "default" : "outline"}
              onClick={() => setTagFilter(tagFilter === "__none__" ? null : "__none__")}
              className="rounded-xl text-xs px-4"
            >
              Sem tag ({tagStats["__none__"] || 0})
            </Button>
          )}
          {tagFilter !== null && (
            <span className="text-xs text-muted-foreground ml-1">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="glass-subtle rounded-2xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="glass-subtle rounded-2xl py-12 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={load} className="mt-3 rounded-xl">Tentar novamente</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-subtle rounded-2xl py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {filter ? "Nenhum resultado encontrado" : "Nenhum inscrito cadastrado"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => {
              const cfg = getTagConfig(p.tag);
              const initials = getInitials(p.name);
              return (
                <button
                  key={p.id}
                  onClick={() => openProfile(p)}
                  className="glass-subtle rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/[0.06] hover:shadow-md transition-all text-left cursor-pointer group w-full"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with initials */}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} font-bold text-sm group-hover:scale-105 transition-transform`}
                    >
                      <span className={cfg.text}>{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate leading-tight group-hover:text-primary transition-colors">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.tag ? (
                          <span className={`text-xs font-medium ${cfg.text}`}>{p.tag}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">Sem tag</span>
                        )}
                        {p.registrations.length > 0 && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-xs text-muted-foreground">{p.registrations.length} inscrição{p.registrations.length !== 1 ? "s" : ""}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Registrations preview — chips compactos */}
                  {p.registrations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.registrations.slice(0, 3).map((r) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-border/20 text-muted-foreground max-w-[140px]"
                          title={`${r.event_name} — ${r.ticket_type}`}
                        >
                          <CalendarDays className="w-2.5 h-2.5 shrink-0 text-primary/60" />
                          <span className="truncate">
                            {r.event_name.replace(/\s*[@|]\s*.*/g, "").replace(/\s*-\s*Guests.*/, "")}
                          </span>
                        </span>
                      ))}
                      {p.tag === "Day Pass" && p.registrations[0]?.day_pass_date && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
                          <CalendarDays className="w-2.5 h-2.5" />
                          {new Date(p.registrations[0].day_pass_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                      {p.registrations.length > 3 && (
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-primary/8 text-primary/70 font-medium">
                          +{p.registrations.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <Dialog open={!!selectedPerson} onOpenChange={(open) => { if (!open) setSelectedPerson(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedPerson && (() => {
            const cfg = getTagConfig(selectedPerson.tag);
            const initials = getInitials(selectedPerson.name);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} font-bold text-base`}>
                      <span className={cfg.text}>{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-lg leading-tight truncate">{selectedPerson.name}</p>
                      {selectedPerson.tag && (
                        <p className="text-sm text-muted-foreground font-normal truncate">{selectedPerson.tag}</p>
                      )}
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  {/* Tag editor */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Tag de acesso</label>
                    <div className="flex gap-2">
                      <Select
                        value={editTag || "__none__"}
                        onValueChange={(v) => setEditTag(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger className="rounded-xl bg-background/50 flex-1">
                          <SelectValue placeholder="Sem tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Sem tag —</SelectItem>
                          <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                          <SelectItem value="Explorer">Explorer</SelectItem>
                          <SelectItem value="Day Pass">Day Pass</SelectItem>
                          <SelectItem value="Weekly">Weekly Pass</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleSaveTag}
                        disabled={savingTag || editTag === (selectedPerson.tag || "")}
                        className="rounded-xl px-5"
                      >
                        {savingTag ? "..." : "Salvar"}
                      </Button>
                    </div>
                  </div>

                  {/* Day pass date */}
                  {selectedPerson.registrations.some(r => r.day_pass_date !== null || selectedPerson.tag === "Day Pass") && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Day Pass</label>
                      {selectedPerson.registrations.map((r) => (
                        r.day_pass_date !== null || selectedPerson.tag === "Day Pass" ? (
                          <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                            <span className="text-sm truncate">{r.event_name}</span>
                            {r.day_pass_date ? (
                              <span className="text-xs text-emerald-400 font-medium ml-2 shrink-0">
                                {new Date(r.day_pass_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                              </span>
                            ) : (
                              <input
                                type="date"
                                className="text-xs bg-transparent border border-emerald-500/30 rounded px-2 py-0.5 text-emerald-400 w-32 ml-2"
                                onChange={async (e) => {
                                  if (!e.target.value) return;
                                  await setDayPassDate({ data: { registrationId: r.id, date: e.target.value } });
                                  load();
                                }}
                              />
                            )}
                          </div>
                        ) : null
                      ))}
                    </div>
                  )}

                  {/* Weekly Pass start date */}
                  {selectedPerson.registrations.some(r => r.week_pass_start_date !== null || selectedPerson.tag === "Weekly") && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Weekly Pass (7 dias a partir de)</label>
                      {selectedPerson.registrations.map((r) => (
                        r.week_pass_start_date !== null || selectedPerson.tag === "Weekly" ? (
                          <div key={`wp-${r.id}`} className="flex items-center justify-between px-3 py-2 rounded-xl bg-violet-500/5 border border-violet-500/15">
                            <span className="text-sm truncate">{r.event_name}</span>
                            {r.week_pass_start_date ? (
                              <span className="text-xs text-violet-400 font-medium ml-2 shrink-0">
                                {new Date(r.week_pass_start_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                {" → "}
                                {new Date(new Date(r.week_pass_start_date + "T12:00:00").getTime() + 6 * 86400000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                              </span>
                            ) : (
                              <input
                                type="date"
                                className="text-xs bg-transparent border border-violet-500/30 rounded px-2 py-0.5 text-violet-400 w-32 ml-2"
                                onChange={async (e) => {
                                  if (!e.target.value) return;
                                  await setWeekPassStartDate({ data: { registrationId: r.id, date: e.target.value } });
                                  load();
                                }}
                              />
                            )}
                          </div>
                        ) : null
                      ))}
                    </div>
                  )}

                  {/* Inscriptions */}
                  {selectedPerson.registrations.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Inscrições</p>
                        <Badge className="bg-primary/10 text-primary border-0 rounded-lg text-xs">
                          {selectedPerson.registrations.length} evento{selectedPerson.registrations.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedPerson.registrations.map((r) => (
                          <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/20 group/reg">
                            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                              <CalendarDays className="w-4 h-4 text-primary/70" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate leading-tight">{r.event_name}</p>
                              <p className="text-xs text-muted-foreground/70 mt-0.5">{r.ticket_type} · via {r.source}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Check-in history */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Histórico de presenças</p>
                      {!historyLoading && (
                        <Badge className="bg-primary/10 text-primary border-0 rounded-lg text-xs">
                          {checkinHistory.length} total
                        </Badge>
                      )}
                    </div>

                    {historyLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" />)}
                      </div>
                    ) : checkinHistory.length === 0 ? (
                      <div className="py-6 text-center glass-subtle rounded-xl">
                        <p className="text-sm text-muted-foreground">Nenhum check-in registrado</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                        {checkinHistory.map((c) => (
                          <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/20 gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{c.event_name || "Check-in avulso"}</p>
                                <p className="text-xs text-muted-foreground">{c.period} · {c.access_type}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-medium text-foreground/80">
                                {new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                <Clock className="w-3 h-3" />
                                {new Date(c.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
