import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import Papa from "papaparse";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileUp, CheckCircle } from "lucide-react";
import { importPeople } from "@/server/import.functions";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Importar — Ipê Village Check-In" },
      { name: "description", content: "Importação de inscritos do Luma" },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: "",
    email: "",
    ticket_type: "",
    event_name: "",
    tag: "",
  });
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; registrations: number } | null>(null);
  const [eventNameOverride, setEventNameOverride] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    Papa.parse(file, {
      complete: (res) => {
        const data = res.data as string[][];
        if (data.length < 2) return;
        const h = data[0];
        setHeaders(h);
        setRows(data.slice(1).filter((r) => r.some((c) => c?.trim())));

        const auto: Record<string, string> = { name: "", email: "", ticket_type: "", event_name: "", tag: "" };
        for (const col of h) {
          const lower = col.toLowerCase();
          if (lower.includes("name") && !lower.includes("event") && !auto.name) auto.name = col;
          if (lower.includes("email") && !auto.email) auto.email = col;
          if (lower.includes("ticket") && !auto.ticket_type) auto.ticket_type = col;
          if (lower.includes("event") && !auto.event_name) auto.event_name = col;
        }
        setMapping(auto);
      },
    });
  };

  const handleImport = async () => {
    if (!mapping.name || !mapping.email) return;
    setImporting(true);

    const nameIdx = headers.indexOf(mapping.name);
    const emailIdx = headers.indexOf(mapping.email);
    const ticketIdx = mapping.ticket_type ? headers.indexOf(mapping.ticket_type) : -1;
    const eventIdx = mapping.event_name ? headers.indexOf(mapping.event_name) : -1;
    const tagIdx = mapping.tag ? headers.indexOf(mapping.tag) : -1;

    const mapped = rows
      .filter((r) => r[nameIdx]?.trim() && r[emailIdx]?.trim())
      .map((r) => ({
        name: r[nameIdx].trim(),
        email: r[emailIdx].trim(),
        ticket_type: ticketIdx >= 0 ? r[ticketIdx]?.trim() || "Geral" : "Geral",
        event_name: eventNameOverride || (eventIdx >= 0 ? r[eventIdx]?.trim() || "Evento" : "Evento"),
        tag: tagIdx >= 0 ? r[tagIdx]?.trim() || undefined : undefined,
      }));

    try {
      const res = await importPeople({ data: { rows: mapped } });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Importar Inscritos</h2>
          <p className="text-muted-foreground text-sm mt-1">Upload de CSV exportado do Luma</p>
        </div>

        {/* Upload */}
        <div className="glass rounded-3xl p-8">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border/40 rounded-2xl p-14 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium">
              Clique ou arraste um arquivo CSV
            </p>
            <p className="text-muted-foreground/60 text-sm mt-1">Exportado do Luma ou similar</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Mapping */}
        {headers.length > 0 && !result && (
          <div className="glass rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Mapeamento de colunas</h3>
              <Badge className="bg-primary/10 text-primary border-0 rounded-lg">
                {rows.length} linhas
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ["name", "Nome *"],
                  ["email", "Email *"],
                  ["ticket_type", "Tipo de Ticket"],
                  ["event_name", "Nome do Evento"],
                  ["tag", "Tag (ex: Arquiteto)"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm text-muted-foreground font-medium">{label}</label>
                  <Select
                    value={mapping[key]}
                    onValueChange={(v) => setMapping({ ...mapping, [key]: v })}
                  >
                    <SelectTrigger className="rounded-xl bg-background/50">
                      <SelectValue placeholder="Selecionar coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Nenhuma —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground font-medium">Sobrescrever evento</label>
                <Input
                  placeholder="Nome fixo para todos (opcional)"
                  value={eventNameOverride}
                  onChange={(e) => setEventNameOverride(e.target.value)}
                  className="rounded-xl bg-background/50"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="glass-subtle rounded-2xl overflow-auto max-h-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h} className="text-xs whitespace-nowrap font-semibold">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-xs whitespace-nowrap">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing || !mapping.name || !mapping.email}
              className="w-full h-13 font-bold rounded-2xl shadow-lg shadow-primary/20 text-base"
            >
              <FileUp className="w-5 h-5 mr-2" />
              {importing ? "Importando..." : `Importar ${rows.length} registros`}
            </Button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="glass rounded-3xl p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/12 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xl font-bold text-primary">Importação concluída!</p>
            <div className="flex justify-center gap-8 text-sm">
              <span>
                <strong className="text-lg">{result.created}</strong>
                <span className="text-muted-foreground ml-1">novos</span>
              </span>
              <span>
                <strong className="text-lg">{result.updated}</strong>
                <span className="text-muted-foreground ml-1">atualizados</span>
              </span>
              <span>
                <strong className="text-lg">{result.registrations}</strong>
                <span className="text-muted-foreground ml-1">inscrições</span>
              </span>
            </div>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => {
                setHeaders([]);
                setRows([]);
                setResult(null);
              }}
            >
              Importar outro arquivo
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
