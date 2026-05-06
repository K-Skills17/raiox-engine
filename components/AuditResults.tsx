"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AuditData {
  pagespeed_mobile: number | null;
  pagespeed_desktop: number | null;
  page_load_seconds: number | null;
  whatsapp_clicks: number | null;
  cases_present: boolean | null;
  cro_visible: boolean | null;
  problematic_words: string[];
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <Badge variant="outline">--</Badge>;
  if (score >= 70) return <Badge className="bg-green-900/30 text-green-400 border-green-500/30">{score}</Badge>;
  if (score >= 40) return <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-500/30">{score}</Badge>;
  return <Badge className="bg-red-900/30 text-red-400 border-red-500/30">{score}</Badge>;
}

function BoolBadge({ value, yes, no }: { value: boolean | null; yes: string; no: string }) {
  if (value == null) return <Badge variant="outline">--</Badge>;
  return value ? (
    <Badge className="bg-green-900/30 text-green-400">{yes}</Badge>
  ) : (
    <Badge className="bg-red-900/30 text-red-400">{no}</Badge>
  );
}

export default function AuditResults({ audit }: { audit: AuditData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">PageSpeed Mobile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-4xl text-gold">
              {audit.pagespeed_mobile ?? "--"}
            </span>
            <span className="text-muted-foreground">/100</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">PageSpeed Desktop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-4xl text-gold">
              {audit.pagespeed_desktop ?? "--"}
            </span>
            <span className="text-muted-foreground">/100</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Tempo de Carga (LCP)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-4xl text-gold">
              {audit.page_load_seconds ?? "--"}
            </span>
            <span className="text-muted-foreground">seg</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <ScoreBadge score={audit.whatsapp_clicks === 1 ? 100 : audit.whatsapp_clicks === 3 ? 30 : null} />
            <span className="text-sm">
              {audit.whatsapp_clicks === 1
                ? "Link direto na home"
                : audit.whatsapp_clicks === 3
                  ? "3+ cliques para contato"
                  : "--"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Casos/Depoimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <BoolBadge value={audit.cases_present} yes="Presente" no="Ausente" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">CRO Visivel</CardTitle>
        </CardHeader>
        <CardContent>
          <BoolBadge value={audit.cro_visible} yes="Visivel" no="Nao encontrado" />
        </CardContent>
      </Card>

      {audit.problematic_words && audit.problematic_words.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Palavras Problematicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {audit.problematic_words.map((w, i) => (
                <Badge key={i} className="bg-red-900/30 text-red-400">
                  {w}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
