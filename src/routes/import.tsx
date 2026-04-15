import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import Papa from "papaparse";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

        // Auto-map common Luma columns
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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Importar Inscritos</h2>

        {/* Upload */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border/50 rounded-xl p-12 text-center cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                Clique ou arraste um arquivo CSV exportado do Luma
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mapping */}
        {headers.length > 0 && !result && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">
                Mapeamento de colunas
                <Badge variant="secondary" className="ml-3">
                  {rows.length} linhas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <div key={key} className="space-y-1">
                    <label className="text-sm text-muted-foreground">{label}</label>
                    <Select
                      value={mapping[key]}
                      onValueChange={(v) => setMapping({ ...mapping, [key]: v })}
                    >
                      <SelectTrigger className="bg-background/50">
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
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Sobrescrever evento</label>
                  <Input
                    placeholder="Nome fixo para todos (opcional)"
                    value={eventNameOverride}
                    onChange={(e) => setEventNameOverride(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded-md overflow-auto max-h-60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((h) => (
                        <TableHead key={h} className="text-xs whitespace-nowrap">
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
                className="w-full h-11 font-bold"
              >
                <FileUp className="w-4 h-4 mr-2" />
                {importing ? "Importando..." : `Importar ${rows.length} registros`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card className="border-primary/30">
            <CardContent className="p-6 text-center space-y-2">
              <CheckCircle className="w-10 h-10 mx-auto text-primary" />
              <p className="text-lg font-bold text-primary">Importação concluída!</p>
              <div className="flex justify-center gap-6 text-sm">
                <span>
                  <strong>{result.created}</strong> novos
                </span>
                <span>
                  <strong>{result.updated}</strong> atualizados
                </span>
                <span>
                  <strong>{result.registrations}</strong> inscrições
                </span>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setHeaders([]);
                  setRows([]);
                  setResult(null);
                }}
              >
                Importar outro arquivo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
