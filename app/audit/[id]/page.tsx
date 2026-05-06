"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AuditResults from "@/components/AuditResults";
import ManualFieldsForm from "@/components/ManualFieldsForm";
import FilmableScriptCard from "@/components/FilmableScriptCard";
import BrollChecklistCard from "@/components/BrollChecklistCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AuditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);

  const fetchAudit = useCallback(async () => {
    const res = await fetch(`/api/audit/${id}`);
    if (res.ok) {
      setAudit(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  async function handlePushToNotion() {
    setPushing(true);
    try {
      const res = await fetch(`/api/push-to-notion/${id}`, { method: "POST" });
      if (res.ok) {
        fetchAudit();
      }
    } finally {
      setPushing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando auditoria...</p>
      </main>
    );
  }

  if (!audit) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Auditoria nao encontrada.</p>
      </main>
    );
  }

  const statusLabels: Record<string, string> = {
    auditing: "Analisando",
    automated_done: "Automatizado concluido",
    manual_pending: "Aguardando manual",
    complete: "Completo",
    pushed_to_notion: "Enviado ao Notion",
    failed: "Falhou",
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-gold text-sm hover:underline mb-2 block"
            >
              &larr; Voltar
            </button>
            <h1 className="font-heading text-3xl text-gold">
              {audit.clinic_name || audit.clinic_url}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {audit.clinic_url}
              {audit.city && ` · ${audit.city}`}
              {audit.tier && ` · Tier ${audit.tier}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{statusLabels[audit.status] || audit.status}</Badge>
            {audit.status !== "pushed_to_notion" && (
              <Button
                onClick={handlePushToNotion}
                disabled={pushing}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-black"
              >
                {pushing ? "Enviando..." : "Push to Notion"}
              </Button>
            )}
            {audit.notion_page_id && (
              <Badge className="bg-green-900/30 text-green-400">No Notion</Badge>
            )}
          </div>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Automated findings */}
          <div>
            <h2 className="font-heading text-xl text-gold mb-4">
              Resultados Automatizados
            </h2>
            <AuditResults audit={audit} />
          </div>

          {/* Middle: Manual fields */}
          <div>
            <ManualFieldsForm
              auditId={id}
              initial={{
                gbp_photos: audit.gbp_photos,
                gbp_last_reply_date: audit.gbp_last_reply_date,
                gbp_implant_featured: audit.gbp_implant_featured,
                meta_ads_count: audit.meta_ads_count,
                meta_ads_violations: audit.meta_ads_violations || [],
                whatsapp_response_minutes: audit.whatsapp_response_minutes,
              }}
              onSaved={fetchAudit}
            />
          </div>

          {/* Right: Filmable script + B-Roll */}
          <div className="space-y-6">
            <FilmableScriptCard
              script={audit.filmable_script || ""}
              reelTemplate={audit.best_reel_template || "REEL-01"}
              auditId={id}
              onRegenerated={(data) => {
                setAudit({
                  ...audit,
                  filmable_script: data.filmableScript,
                  best_reel_template: data.bestReelTemplate,
                });
              }}
            />
            <BrollChecklistCard audit={audit} />
          </div>
        </div>

        {/* Full report (collapsed) */}
        {audit.full_audit_report && (
          <details className="mt-8">
            <summary className="font-heading text-lg text-gold cursor-pointer hover:underline">
              Relatorio Completo
            </summary>
            <div className="mt-4 bg-card rounded-lg p-6 border border-border">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {audit.full_audit_report}
              </pre>
            </div>
          </details>
        )}
      </div>
    </main>
  );
}
