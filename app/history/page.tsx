"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Audit {
  id: string;
  clinic_url: string;
  clinic_name: string | null;
  city: string | null;
  tier: number | null;
  best_reel_template: string | null;
  status: string;
  pagespeed_mobile: number | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  "all",
  "auditing",
  "automated_done",
  "manual_pending",
  "complete",
  "pushed_to_notion",
  "failed",
];

const statusLabels: Record<string, string> = {
  all: "Todos",
  auditing: "Analisando",
  automated_done: "Auto concluido",
  manual_pending: "Aguardando manual",
  complete: "Completo",
  pushed_to_notion: "No Notion",
  failed: "Falhou",
};

export default function HistoryPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchAudits() {
      const res = await fetch("/api/history");
      if (res.ok) {
        setAudits(await res.json());
      }
      setLoading(false);
    }
    fetchAudits();
  }, []);

  const filtered = audits.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.clinic_url.toLowerCase().includes(q) ||
        (a.clinic_name && a.clinic_name.toLowerCase().includes(q)) ||
        (a.city && a.city.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const statusColor: Record<string, string> = {
    auditing: "bg-yellow-900/30 text-yellow-400",
    automated_done: "bg-blue-900/30 text-blue-400",
    manual_pending: "bg-gold/20 text-gold",
    complete: "bg-green-900/30 text-green-400",
    pushed_to_notion: "bg-green-900/30 text-green-400",
    failed: "bg-red-900/30 text-red-400",
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-gold text-sm hover:underline mb-2 block"
            >
              &larr; Voltar
            </button>
            <h1 className="font-heading text-3xl text-gold">Historico</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s)}
              className={filter === s ? "bg-gold text-black" : ""}
            >
              {statusLabels[s]}
            </Button>
          ))}
        </div>

        <Input
          placeholder="Buscar por URL, clinica ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 max-w-md"
        />

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma auditoria encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-2">Clinica</th>
                  <th className="text-left py-3 px-2">Cidade</th>
                  <th className="text-left py-3 px-2">Tier</th>
                  <th className="text-left py-3 px-2">Reel</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Score</th>
                  <th className="text-left py-3 px-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => router.push(`/audit/${a.id}`)}
                    className="border-b border-border hover:bg-card cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="font-medium">
                        {a.clinic_name || "---"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {a.clinic_url}
                      </div>
                    </td>
                    <td className="py-3 px-2">{a.city || "---"}</td>
                    <td className="py-3 px-2">{a.tier || "---"}</td>
                    <td className="py-3 px-2">
                      {a.best_reel_template || "---"}
                    </td>
                    <td className="py-3 px-2">
                      <Badge className={statusColor[a.status] || ""}>
                        {statusLabels[a.status] || a.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      {a.pagespeed_mobile != null
                        ? `${a.pagespeed_mobile}/100`
                        : "---"}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
