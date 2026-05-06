"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FilmableScriptCard({
  script,
  reelTemplate,
  auditId,
  onRegenerated,
}: {
  script: string;
  reelTemplate: string;
  auditId: string;
  onRegenerated: (data: { filmableScript: string; bestReelTemplate: string }) => void;
}) {
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/audit/${auditId}/regenerate`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        onRegenerated(data);
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-lg text-gold">
            Script Filmavel
          </CardTitle>
          <Badge className="bg-gold/20 text-gold border-gold/30">
            {reelTemplate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-background rounded-lg p-4 border border-border mb-4">
          <pre className="whitespace-pre-wrap text-sm font-body leading-relaxed">
            {script || "Nenhum script gerado ainda."}
          </pre>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1"
          >
            {copied ? "Copiado!" : "Copiar Script"}
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex-1 bg-gold text-black hover:bg-gold-light"
          >
            {regenerating ? "Regenerando..." : "Regenerar Script"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
