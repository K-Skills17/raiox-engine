import { fetchAndParseHTML } from "./fetch-html";
import { runPageSpeed } from "./pagespeed";
import { analyzeCopy } from "./analyze-copy";
import { runClaudeAudit } from "./claude-audit";
import { createServiceClient } from "@/lib/supabase/server";

export async function runFullAudit(
  url: string,
  userId: string,
  opts?: { city?: string; tier?: number }
) {
  const supabase = await createServiceClient();

  // 1. Create the audit row in 'auditing' state
  const { data: audit, error: insertError } = await supabase
    .from("audits")
    .insert({
      clinic_url: url,
      city: opts?.city || null,
      tier: opts?.tier || null,
      status: "auditing",
      created_by: userId,
    })
    .select()
    .single();

  if (insertError || !audit) {
    throw new Error(`Failed to create audit row: ${insertError?.message}`);
  }

  try {
    // 2. Run automated checks in parallel
    const [htmlData, pageSpeedData] = await Promise.all([
      fetchAndParseHTML(url),
      runPageSpeed(url),
    ]);

    // 3. Run copy analysis
    const copyFindings = analyzeCopy(htmlData.text);

    // 4. Build automated findings
    const automatedFindings = {
      pagespeed_mobile: pageSpeedData.mobile.score,
      pagespeed_desktop: pageSpeedData.desktop.score,
      page_load_seconds: pageSpeedData.mobile.lcpSeconds,
      whatsapp_clicks: htmlData.whatsappClicks,
      cases_present: htmlData.casesPresent,
      cro_visible: htmlData.croVisible,
      problematic_words: copyFindings.violations,
      raw_html_excerpt: htmlData.excerpt,
      raw_pagespeed: pageSpeedData.raw,
      status: "automated_done" as const,
    };

    // 5. Update audit with automated findings
    await supabase.from("audits").update(automatedFindings).eq("id", audit.id);

    // 6. Call Claude API
    const claudeResult = await runClaudeAudit({
      url,
      city: opts?.city,
      tier: opts?.tier,
      automatedFindings,
      manualFindings: null,
      htmlExcerpt: htmlData.excerpt,
    });

    // 7. Save Claude output
    await supabase
      .from("audits")
      .update({
        clinic_name: claudeResult.clinicName || null,
        best_reel_template: claudeResult.bestReelTemplate,
        filmable_script: claudeResult.filmableScript,
        full_audit_report: claudeResult.fullReport,
        status: "manual_pending",
      })
      .eq("id", audit.id);

    return audit.id;
  } catch (err) {
    await supabase
      .from("audits")
      .update({ status: "failed" })
      .eq("id", audit.id);
    throw err;
  }
}
