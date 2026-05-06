import Anthropic from "@anthropic-ai/sdk";
import { RAIOX_SYSTEM_PROMPT } from "@/lib/prompts/raiox-system";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface ClaudeAuditInput {
  url: string;
  city?: string;
  tier?: number;
  automatedFindings: {
    pagespeed_mobile: number;
    pagespeed_desktop: number;
    page_load_seconds: number;
    whatsapp_clicks: number;
    cases_present: boolean;
    cro_visible: boolean;
    problematic_words: string[];
  };
  manualFindings: {
    gbp_photos?: number;
    gbp_last_reply_date?: string;
    gbp_implant_featured?: boolean;
    meta_ads_count?: number;
    meta_ads_violations?: string[];
    whatsapp_response_minutes?: number;
  } | null;
  htmlExcerpt: string;
}

export interface ClaudeAuditResult {
  fullReport: string;
  bestReelTemplate: string;
  filmableScript: string;
  clinicName: string | null;
}

export async function runClaudeAudit(
  input: ClaudeAuditInput
): Promise<ClaudeAuditResult> {
  const userMsg = buildUserMessage(input);

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: RAIOX_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMsg }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");

  const bestReelTemplate = extractReelId(text);
  const filmableScript = extractSection(text, "FILMABLE SCRIPT");
  const clinicName = extractClinicName(text);

  return { fullReport: text, bestReelTemplate, filmableScript, clinicName };
}

function buildUserMessage(input: ClaudeAuditInput): string {
  const af = input.automatedFindings;
  let msg = `URL: ${input.url}
City: ${input.city || "unknown"}
Tier: ${input.tier || "unknown"}

=== AUTOMATED FINDINGS (already collected) ===
PageSpeed (mobile): ${af.pagespeed_mobile}/100
PageSpeed (desktop): ${af.pagespeed_desktop}/100
Page load (LCP): ${af.page_load_seconds}s
WhatsApp clicks from home: ${af.whatsapp_clicks}
Cases present on site: ${af.cases_present ? "Yes" : "No"}
CRO visible on site: ${af.cro_visible ? "Yes" : "No"}
Problematic words found: ${JSON.stringify(af.problematic_words)}

=== HTML EXCERPT ===
${input.htmlExcerpt}

=== MANUAL FINDINGS ===
`;

  if (input.manualFindings) {
    const mf = input.manualFindings;
    msg += `GBP photos: ${mf.gbp_photos ?? "not checked"}
GBP last review reply: ${mf.gbp_last_reply_date ?? "not checked"}
GBP implant featured: ${mf.gbp_implant_featured != null ? (mf.gbp_implant_featured ? "Yes" : "No") : "not checked"}
Meta active ads: ${mf.meta_ads_count ?? "not checked"}
Meta ad violations: ${mf.meta_ads_violations?.length ? JSON.stringify(mf.meta_ads_violations) : "none found"}
WhatsApp response time: ${mf.whatsapp_response_minutes != null ? mf.whatsapp_response_minutes + " minutes" : "not checked"}`;
  } else {
    msg += `Not yet collected. Mark them as MANUAL CHECK NEEDED in your output.`;
  }

  msg += `\n\nRun the full audit now. Output the structured report per the format in your system prompt.`;

  return msg;
}

function extractReelId(text: string): string {
  const match = text.match(/REEL-(\d{2})/);
  return match ? `REEL-${match[1]}` : "REEL-01";
}

function extractSection(text: string, heading: string): string {
  const re = new RegExp(
    `###?\\s*${heading}[\\s\\S]*?(?=\\n###?\\s|$)`,
    "i"
  );
  const match = text.match(re);
  return match ? match[0].trim() : "";
}

function extractClinicName(text: string): string | null {
  const re = /###?\s*CLINIC(?:A)?\s*NAME\s*\n+(.+)/i;
  const match = text.match(re);
  return match ? match[1].trim() : null;
}
