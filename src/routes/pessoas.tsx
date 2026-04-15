import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  useState(() => {
    load();
  });

  const filtered = filter.length >= 2
    ? people.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          p.email.toLowerCase().includes(filter.toLowerCase()),
      )
    : people;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Inscritos</h2>
          <Badge variant="outline" className="text-lg px-4 py-1.5 border-primary/30 text-primary">
            <Users className="w-5 h-5 mr-2" />
            {totalCount} pessoas
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nome ou email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 h-11 bg-background/50"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {filter ? "Nenhum resultado encontrado" : "Nenhum inscrito cadastrado"}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <Card key={p.id} className="border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{p.name}</span>
                        {p.tag && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {p.tag}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{p.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      {p.registrations.length > 0 ? (
                        p.registrations.map((r) => (
                          <Badge key={r.id} variant="outline" className="text-xs">
                            <Ticket className="w-3 h-3 mr-1" />
                            {r.ticket_type} — {r.event_name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem inscrição</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
