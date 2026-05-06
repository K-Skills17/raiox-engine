import { fetchAndParseHTML } from "./fetch-html";
import { runPageSpeed } from "./pagespeed";
import { analyzeCopy } from "./analyze-copy";
import { runClaudeAudit } from "./claude-audit";
import { scrapeGBP } from "./gbp-scraper";
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
    // 2. Run automated checks in parallel (HTML + PageSpeed)
    const [htmlData, pageSpeedData] = await Promise.all([
      fetchAndParseHTML(url),
      runPageSpeed(url),
    ]);

    // 3. Run copy analysis
    const copyFindings = analyzeCopy(htmlData.text);

    // 4. Extract clinic name for GBP search (from <title> or hostname)
    const clinicName = htmlData.title || new URL(url).hostname;

    // 5. Build automated findings
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

    // 6. Update audit with automated findings
    await supabase.from("audits").update(automatedFindings).eq("id", audit.id);

    // 7. Scrape GBP data (runs after we have the clinic name)
    const gbpData = await scrapeGBP(clinicName, opts?.city);

    // 8. Update audit with GBP data if found
    if (gbpData.gbp_photos != null || gbpData.gbp_last_reply_date || gbpData.gbp_implant_featured != null) {
      await supabase
        .from("audits")
        .update({
          gbp_photos: gbpData.gbp_photos,
          gbp_last_reply_date: gbpData.gbp_last_reply_date,
          gbp_implant_featured: gbpData.gbp_implant_featured,
          clinic_name: gbpData.gbp_name || null,
        })
        .eq("id", audit.id);
    }

    // 9. Call Claude API with all data including GBP
    const claudeResult = await runClaudeAudit({
      url,
      city: opts?.city,
      tier: opts?.tier,
      automatedFindings,
      manualFindings: gbpData.gbp_photos != null
        ? {
            gbp_photos: gbpData.gbp_photos,
            gbp_last_reply_date: gbpData.gbp_last_reply_date ?? undefined,
            gbp_implant_featured: gbpData.gbp_implant_featured ?? undefined,
          }
        : null,
      htmlExcerpt: htmlData.excerpt,
    });

    // 10. Save Claude output
    await supabase
      .from("audits")
      .update({
        clinic_name: gbpData.gbp_name || claudeResult.clinicName || null,
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
