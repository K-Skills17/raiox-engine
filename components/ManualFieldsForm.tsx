"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ManualFields {
  gbp_photos: number | null;
  gbp_last_reply_date: string | null;
  gbp_implant_featured: boolean | null;
  meta_ads_count: number | null;
  meta_ads_violations: string[];
  whatsapp_response_minutes: number | null;
}

export default function ManualFieldsForm({
  auditId,
  initial,
  onSaved,
}: {
  auditId: string;
  initial: ManualFields;
  onSaved: () => void;
}) {
  const [fields, setFields] = useState<ManualFields>(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/audit/${auditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gbp_photos: fields.gbp_photos,
          gbp_last_reply_date: fields.gbp_last_reply_date,
          gbp_implant_featured: fields.gbp_implant_featured,
          meta_ads_count: fields.meta_ads_count,
          meta_ads_violations: fields.meta_ads_violations,
          whatsapp_response_minutes: fields.whatsapp_response_minutes,
        }),
      });
      if (res.ok) onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg text-gold">Verificacoes Manuais</h3>

      <div className="space-y-2">
        <Label>Fotos no GBP</Label>
        <Input
          type="number"
          min={0}
          value={fields.gbp_photos ?? ""}
          onChange={(e) =>
            setFields({ ...fields, gbp_photos: e.target.value ? parseInt(e.target.value) : null })
          }
          placeholder="Quantidade de fotos"
        />
      </div>

      <div className="space-y-2">
        <Label>Ultima resposta a avaliacao (GBP)</Label>
        <Input
          type="date"
          value={fields.gbp_last_reply_date ?? ""}
          onChange={(e) =>
            setFields({ ...fields, gbp_last_reply_date: e.target.value || null })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Implante em destaque no GBP?</Label>
        <div className="flex gap-2">
          <Button
            variant={fields.gbp_implant_featured === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFields({ ...fields, gbp_implant_featured: true })}
            className={fields.gbp_implant_featured === true ? "bg-gold text-black" : ""}
          >
            Sim
          </Button>
          <Button
            variant={fields.gbp_implant_featured === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFields({ ...fields, gbp_implant_featured: false })}
            className={fields.gbp_implant_featured === false ? "bg-gold text-black" : ""}
          >
            Nao
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Anuncios ativos no Meta</Label>
        <Input
          type="number"
          min={0}
          value={fields.meta_ads_count ?? ""}
          onChange={(e) =>
            setFields({ ...fields, meta_ads_count: e.target.value ? parseInt(e.target.value) : null })
          }
          placeholder="Quantidade de anuncios"
        />
      </div>

      <div className="space-y-2">
        <Label>Violacoes nos anuncios (notas)</Label>
        <Textarea
          value={fields.meta_ads_violations?.join("\n") ?? ""}
          onChange={(e) =>
            setFields({
              ...fields,
              meta_ads_violations: e.target.value
                .split("\n")
                .filter((l) => l.trim()),
            })
          }
          placeholder="Uma violacao por linha"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Tempo de resposta WhatsApp (minutos)</Label>
        <Input
          type="number"
          min={0}
          value={fields.whatsapp_response_minutes ?? ""}
          onChange={(e) =>
            setFields({
              ...fields,
              whatsapp_response_minutes: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          placeholder="Minutos para responder"
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gold text-black hover:bg-gold-light"
      >
        {saving ? "Salvando..." : "Salvar Verificacoes"}
      </Button>
    </div>
  );
}
