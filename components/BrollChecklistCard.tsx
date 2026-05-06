"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BrollChecklistProps {
  audit: {
    clinic_url: string;
    clinic_name: string | null;
    pagespeed_mobile: number | null;
    pagespeed_desktop: number | null;
    whatsapp_clicks: number | null;
    cases_present: boolean | null;
    cro_visible: boolean | null;
    problematic_words: string[];
    gbp_photos: number | null;
    gbp_last_reply_date: string | null;
    gbp_implant_featured: boolean | null;
    meta_ads_count: number | null;
    meta_ads_violations: string[];
    whatsapp_response_minutes: number | null;
  };
}

interface ChecklistItem {
  label: string;
  what: string;
  done: boolean;
}

export default function BrollChecklistCard({ audit }: BrollChecklistProps) {
  const items: ChecklistItem[] = [
    {
      label: "Site — Home",
      what: `Gravar scroll da home de ${audit.clinic_url}`,
      done: true,
    },
    {
      label: "Site — PageSpeed",
      what: `Gravar teste PageSpeed mobile (score: ${audit.pagespeed_mobile ?? "?"}/100)`,
      done: audit.pagespeed_mobile != null,
    },
    {
      label: "Site — WhatsApp",
      what: audit.whatsapp_clicks === 1
        ? "Gravar clique no WhatsApp direto da home"
        : "Gravar caminho ate o WhatsApp (3+ cliques)",
      done: audit.whatsapp_clicks != null,
    },
    {
      label: "Site — CRO",
      what: audit.cro_visible
        ? "Gravar CRO visivel no site"
        : "Gravar ausencia de CRO no site",
      done: audit.cro_visible != null,
    },
    {
      label: "Site — Palavras",
      what: audit.problematic_words?.length > 0
        ? `Gravar palavras problematicas: ${audit.problematic_words.join(", ")}`
        : "Nenhuma palavra problematica encontrada",
      done: true,
    },
    {
      label: "GBP — Fotos",
      what: audit.gbp_photos != null
        ? `Gravar perfil GBP mostrando ${audit.gbp_photos} fotos`
        : "Abrir GBP e gravar quantidade de fotos",
      done: audit.gbp_photos != null,
    },
    {
      label: "GBP — Avaliacoes",
      what: audit.gbp_last_reply_date
        ? `Gravar ultima resposta a avaliacao (${audit.gbp_last_reply_date})`
        : "Abrir avaliacoes do GBP e gravar ultima resposta",
      done: audit.gbp_last_reply_date != null,
    },
    {
      label: "GBP — Implante",
      what: audit.gbp_implant_featured != null
        ? audit.gbp_implant_featured
          ? "Gravar implante em destaque no GBP"
          : "Gravar ausencia de implante no GBP"
        : "Verificar se implante esta em destaque no GBP",
      done: audit.gbp_implant_featured != null,
    },
    {
      label: "Meta — Anuncios",
      what: audit.meta_ads_count != null
        ? `Gravar Ad Library mostrando ${audit.meta_ads_count} anuncios ativos`
        : "Abrir Ad Library e gravar anuncios ativos",
      done: audit.meta_ads_count != null,
    },
    {
      label: "Meta — Violacoes",
      what: audit.meta_ads_violations?.length > 0
        ? `Gravar violacoes: ${audit.meta_ads_violations.join(", ")}`
        : "Nenhuma violacao encontrada nos anuncios",
      done: true,
    },
    {
      label: "WhatsApp — Resposta",
      what: audit.whatsapp_response_minutes != null
        ? `Gravar tempo de resposta: ${audit.whatsapp_response_minutes} min`
        : "Enviar mensagem e cronometrar resposta",
      done: audit.whatsapp_response_minutes != null,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-lg text-gold">
            B-Roll Capture Plan
          </CardTitle>
          <Badge className="bg-gold/20 text-gold border-gold/30">
            {completedCount}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-sm"
            >
              <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center text-xs ${
                item.done
                  ? "bg-gold/20 border-gold/50 text-gold"
                  : "border-border text-muted-foreground"
              }`}>
                {item.done ? "✓" : ""}
              </span>
              <div>
                <span className="font-medium text-foreground">{item.label}</span>
                <p className="text-muted-foreground text-xs mt-0.5">{item.what}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-background rounded border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Anonimizacao</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Borrar nome da clinica nos anuncios</li>
            <li>• Borrar fotos de pacientes</li>
            <li>• Borrar numero de telefone/WhatsApp</li>
            <li>• Borrar endereco completo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
