import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { runClaudeAudit } from "@/lib/pipeline/claude-audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data: audit } = await serviceClient
    .from("audits")
    .select()
    .eq("id", params.id)
    .single();

  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const claudeResult = await runClaudeAudit({
      url: audit.clinic_url,
      city: audit.city,
      tier: audit.tier,
      automatedFindings: {
        pagespeed_mobile: audit.pagespeed_mobile,
        pagespeed_desktop: audit.pagespeed_desktop,
        page_load_seconds: audit.page_load_seconds,
        whatsapp_clicks: audit.whatsapp_clicks,
        cases_present: audit.cases_present,
        cro_visible: audit.cro_visible,
        problematic_words: audit.problematic_words || [],
      },
      manualFindings: {
        gbp_photos: audit.gbp_photos,
        gbp_last_reply_date: audit.gbp_last_reply_date,
        gbp_implant_featured: audit.gbp_implant_featured,
        meta_ads_count: audit.meta_ads_count,
        meta_ads_violations: audit.meta_ads_violations,
        whatsapp_response_minutes: audit.whatsapp_response_minutes,
      },
      htmlExcerpt: audit.raw_html_excerpt || "",
    });

    await serviceClient
      .from("audits")
      .update({
        best_reel_template: claudeResult.bestReelTemplate,
        filmable_script: claudeResult.filmableScript,
        full_audit_report: claudeResult.fullReport,
        status: "complete",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    return NextResponse.json({
      filmableScript: claudeResult.filmableScript,
      bestReelTemplate: claudeResult.bestReelTemplate,
      fullReport: claudeResult.fullReport,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
