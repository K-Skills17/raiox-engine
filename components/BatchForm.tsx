"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AuditProgress {
  url: string;
  status: "pending" | "running" | "done" | "failed";
  auditId?: string;
  error?: string;
}

export default function BatchForm() {
  const [urls, setUrls] = useState("");
  const [city, setCity] = useState("");
  const [tier, setTier] = useState<number | "">("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<AuditProgress[]>([]);

  function parseUrls(text: string): string[] {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => {
        if (!l.startsWith("http")) return `https://${l}`;
        return l;
      })
      .slice(0, 20);
  }

  async function handleRun() {
    const parsed = parseUrls(urls);
    if (parsed.length === 0) return;

    setRunning(true);
    setProgress(parsed.map((url) => ({ url, status: "pending" })));

    try {
      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: parsed,
          city: city || undefined,
          tier: tier || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Batch failed");
      }

      const data = await res.json();
      // Poll for results
      pollBatch(data.batchId, parsed);
    } catch (e: any) {
      setProgress((prev) =>
        prev.map((p) => ({ ...p, status: "failed" as const, error: e.message }))
      );
      setRunning(false);
    }
  }

  async function pollBatch(batchId: string, parsed: string[]) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/batch?id=${batchId}`);
        if (!res.ok) return;
        const data = await res.json();

        setProgress(
          parsed.map((url, i) => {
            const auditId = data.audit_ids?.[i];
            if (i < data.completed_count + data.failed_count) {
              return {
                url,
                status: i < data.completed_count ? "done" : "failed",
                auditId,
              };
            }
            if (i === data.completed_count + data.failed_count) {
              return { url, status: "running" };
            }
            return { url, status: "pending" };
          })
        );

        if (
          data.status === "complete" ||
          data.status === "partial" ||
          data.status === "failed"
        ) {
          clearInterval(interval);
          setRunning(false);
        }
      } catch {
        // keep polling
      }
    }, 2000);
  }

  const statusColor = {
    pending: "bg-muted text-muted-foreground",
    running: "bg-gold/20 text-gold border-gold/30",
    done: "bg-green-900/30 text-green-400 border-green-500/30",
    failed: "bg-red-900/30 text-red-400 border-red-500/30",
  };

  const statusLabel = {
    pending: "Aguardando",
    running: "Analisando...",
    done: "Concluido",
    failed: "Falhou",
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="urls">URLs (uma por linha, max 20)</Label>
        <Textarea
          id="urls"
          placeholder={"https://www.clinicaexemplo.com.br\nhttps://www.outra-clinica.com.br"}
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          rows={8}
          disabled={running}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {parseUrls(urls).length}/20 URLs
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade (opcional)</Label>
          <Input
            id="city"
            placeholder="Sao Paulo"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={running}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tier">Tier (1-4, opcional)</Label>
          <Input
            id="tier"
            type="number"
            min={1}
            max={4}
            placeholder="1"
            value={tier}
            onChange={(e) =>
              setTier(e.target.value ? parseInt(e.target.value) : "")
            }
            disabled={running}
          />
        </div>
      </div>

      <Button
        onClick={handleRun}
        disabled={running || parseUrls(urls).length === 0}
        className="w-full h-12 text-lg font-heading bg-gold text-black hover:bg-gold-light"
      >
        {running ? "Executando Raio-X..." : "Executar Raio-X"}
      </Button>

      {progress.length > 0 && (
        <div className="space-y-2 mt-6">
          <h3 className="font-heading text-lg text-gold">Progresso</h3>
          {progress.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 bg-card rounded-lg border border-border"
            >
              <span className="text-sm font-mono truncate max-w-[60%]">
                {p.url}
              </span>
              <div className="flex items-center gap-3">
                <Badge className={statusColor[p.status]}>
                  {statusLabel[p.status]}
                </Badge>
                {p.status === "done" && p.auditId && (
                  <a
                    href={`/audit/${p.auditId}`}
                    className="text-gold text-sm hover:underline"
                  >
                    Ver
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
