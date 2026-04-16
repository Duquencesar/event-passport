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
import { Search, Users, Ticket, User, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import {
  getPeopleWithRegistrations,
  getPeopleCount,
  setDayPassDate,
  getPersonCheckinHistory,
  updatePersonTag,
} from "@/server/people.functions";

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
  email: string;
  tag: string | null;
  created_at: string;
  registrations: Array<{
    id: string;
    event_name: string;
    ticket_type: string;
    source: string;
    imported_at: string;
    day_pass_date: string | null;
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

const TAG_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Arquiteto: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  Explorer: { bg: "bg-sky-500/15", text: "text-sky-400", dot: "bg-sky-400" },
  "Day Pass": { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
};

const DEFAULT_TAG_COLOR = { bg: "bg-muted/50", text: "text-muted-foreground", dot: "bg-muted-foreground" };

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || DEFAULT_TAG_COLOR;
}

function PessoasPage() {
  const [people, setPeople] = useState<PersonWithRegs[]>([]);
  const [totalCount, setTotalCount] = useState({ total: 0, checkedIn: 0 });
  const [filter, setFilter] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedPerson, setSelectedPerson] = useState<PersonWithRegs | null>(null);
  const [checkinHistory, setCheckinHistory] = useState<CheckinRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editTag, setEditTag] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, count] = await Promise.all([
        getPeopleWithRegistrations(),
        getPeopleCount(),
      ]);
      setPeople(data as PersonWithRegs[]);
      setTotalCount(count);
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint: load on mount
  useEffect(() => {
    load();
  }, []);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const p of people) {
      if (p.tag) set.add(p.tag);
    }
    return Array.from(set).sort();
  }, [people]);

  const filtered = people.filter((p) => {
    if (tagFilter === "__none__" && p.tag) return false;
    if (tagFilter && tagFilter !== "__none__" && p.tag !== tagFilter) return false;
    if (filter.length >= 2) {
      const q = filter.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    }
    return true;
  });

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
      // Update local state
      setPeople((prev) =>
        prev.map((p) =>
          p.id === selectedPerson.id ? { ...p, tag: newTag || null } : p
        )
      );
      setSelectedPerson((prev) => prev ? { ...prev, tag: newTag || null } : null);
    } finally {
      setSavingTag(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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

        {/* Search + Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome ou email..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-12 h-12 rounded-2xl border-border/40 bg-background/60 focus:bg-background/80 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={tagFilter === null ? "default" : "outline"}
              onClick={() => setTagFilter(null)}
              className="rounded-xl text-xs px-4"
            >
              Todos ({people.length})
            </Button>
            {tags.map((tag) => {
              const count = people.filter((p) => p.tag === tag).length;
              const colors = getTagColor(tag);
              return (
                <Button
                  key={tag}
                  size="sm"
                  variant={tagFilter === tag ? "default" : "outline"}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className="rounded-xl text-xs px-4"
                >
                  <span className={`w-2 h-2 rounded-full ${colors.dot} mr-1.5`} />
                  {tag} ({count})
                </Button>
              );
            })}
            {(() => {
              const noTagCount = people.filter((p) => !p.tag).length;
              return noTagCount > 0 ? (
                <Button
                  size="sm"
                  variant={tagFilter === "__none__" ? "default" : "outline"}
                  onClick={() => setTagFilter(tagFilter === "__none__" ? null : "__none__")}
                  className="rounded-xl text-xs px-4"
                >
                  Sem tag ({noTagCount})
                </Button>
              ) : null;
            })()}
            {tagFilter !== null && (
              <span className="text-xs text-muted-foreground ml-2">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="glass-subtle rounded-2xl py-12 text-center">
            <p className="text-muted-foreground text-sm">Carregando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-subtle rounded-2xl py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {filter ? "Nenhum resultado encontrado" : "Nenhum inscrito cadastrado"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => {
              const colors = p.tag ? getTagColor(p.tag) : null;
              return (
                <button
                  key={p.id}
                  onClick={() => openProfile(p)}
                  className="glass-subtle rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/[0.06] transition-colors text-left cursor-pointer group w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors ? colors.bg : "bg-muted/30"} group-hover:scale-105 transition-transform`}>
                      <User className={`w-5 h-5 ${colors ? colors.text : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate leading-tight group-hover:text-primary transition-colors">{p.name}</p>
                      {p.tag ? (
                        <span className={`text-xs font-medium ${colors?.text}`}>{p.tag}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">Sem tag</span>
                      )}
                    </div>
                  </div>
                  {p.registrations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.registrations.slice(0, 3).map((r) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-border/20 text-muted-foreground max-w-[140px]"
                          title={`${r.event_name} — ${r.ticket_type}`}
                        >
                          <CalendarDays className="w-2.5 h-2.5 shrink-0 text-primary/60" />
                          <span className="truncate">{r.event_name.replace(/\s*[@|]\s*.*/g, '').replace(/\s*-\s*Guests.*/, '')}</span>
                        </span>
                      ))}
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
          {selectedPerson && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedPerson.tag ? getTagColor(selectedPerson.tag).bg : "bg-muted/30"}`}>
                    <User className={`w-5 h-5 ${selectedPerson.tag ? getTagColor(selectedPerson.tag).text : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-lg leading-tight truncate">{selectedPerson.name}</p>
                    <p className="text-sm text-muted-foreground font-normal truncate">{selectedPerson.email}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Tag editor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Tag</label>
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
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleSaveTag}
                      disabled={savingTag || editTag === (selectedPerson.tag || "")}
                      className="rounded-xl px-4"
                    >
                      {savingTag ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>

                {/* Registrations */}
                {selectedPerson.registrations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Inscrições</p>
                    <div className="flex flex-col gap-1.5">
                      {selectedPerson.registrations.map((r) => (
                        <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/20">
                          <div className="flex items-center gap-2 min-w-0">
                            <Ticket className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{r.event_name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] rounded-lg border-border/40 shrink-0 ml-2">
                            {r.ticket_type}
                          </Badge>
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
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    </div>
                  ) : checkinHistory.length === 0 ? (
                    <div className="py-6 text-center glass-subtle rounded-xl">
                      <p className="text-sm text-muted-foreground">Nenhum check-in registrado</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                      {checkinHistory.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/20 gap-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {c.event_name || "Check-in avulso"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {c.period} · {c.access_type}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-foreground/80">
                              {new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {new Date(c.checked_in_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
