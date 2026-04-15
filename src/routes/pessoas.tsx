import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, Ticket } from "lucide-react";
import { getPeopleWithRegistrations, getPeopleCount } from "@/server/people.functions";

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
  }>;
};

function PessoasPage() {
  const [people, setPeople] = useState<PersonWithRegs[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inscritos</h2>
            <p className="text-muted-foreground text-sm mt-1">Pessoas cadastradas no sistema</p>
          </div>
          <div className="glass-strong rounded-2xl px-5 py-3 flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{totalCount}</span>
            <span className="text-sm text-muted-foreground">pessoas</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="space-y-4">
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
              return (
                <Button
                  key={tag}
                  size="sm"
                  variant={tagFilter === tag ? "default" : "outline"}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className="rounded-xl text-xs px-4"
                >
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
          <div className="space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="glass-subtle rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="font-semibold truncate">{p.name}</span>
                      {p.tag && (
                        <Badge className="text-xs shrink-0 rounded-lg bg-primary/10 text-primary border-0 font-medium">
                          {p.tag}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{p.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {p.registrations.length > 0 ? (
                      p.registrations.map((r) => (
                        <Badge key={r.id} variant="outline" className="text-xs rounded-lg border-border/40">
                          <Ticket className="w-3 h-3 mr-1" />
                          {r.ticket_type} — {r.event_name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem inscrição</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
