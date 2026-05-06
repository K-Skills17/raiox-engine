import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const STUDIO_BANK_DB_ID = process.env.NOTION_STUDIO_BANK_DB_ID!;

export async function pushAuditToNotion(audit: any): Promise<string> {
  const reelId = await getNextReelId();

  const page = await notion.pages.create({
    parent: { database_id: STUDIO_BANK_DB_ID },
    properties: {
      "Reel ID": {
        title: [{ text: { content: reelId } }],
      },
      "Pillar": {
        select: { name: pillarFromTemplate(audit.best_reel_template) },
      },
      "Title": {
        rich_text: [
          {
            text: {
              content: truncate(extractTitle(audit.filmable_script), 2000),
            },
          },
        ],
      },
      "Hook": {
        rich_text: [
          {
            text: {
              content: truncate(extractHook(audit.filmable_script), 2000),
            },
          },
        ],
      },
      "Script PT-BR": {
        rich_text: [
          {
            text: {
              content: truncate(audit.filmable_script || "", 2000),
            },
          },
        ],
      },
      "CTA": {
        rich_text: [
          {
            text: {
              content: truncate(extractCTA(audit.filmable_script), 2000),
            },
          },
        ],
      },
      "Length (s)": {
        number: 70,
      },
      "Hashtags": {
        rich_text: [
          {
            text: {
              content: truncate(extractHashtags(audit.filmable_script), 2000),
            },
          },
        ],
      },
      "Status": {
        select: { name: "Drafted" },
      },
    },
  });

  return page.id;
}

async function getNextReelId(): Promise<string> {
  const response = await notion.databases.query({
    database_id: STUDIO_BANK_DB_ID,
    sorts: [{ property: "Reel ID", direction: "descending" }],
    page_size: 1,
  });

  if (response.results.length === 0) return "REEL-001";

  const lastPage = response.results[0] as any;
  const lastTitle = lastPage.properties?.["Reel ID"]?.title?.[0]?.plain_text || "REEL-000";
  const match = lastTitle.match(/REEL-(\d+)/);
  const nextNum = match ? parseInt(match[1]) + 1 : 1;
  return `REEL-${String(nextNum).padStart(3, "0")}`;
}

function pillarFromTemplate(template: string): string {
  const map: Record<string, string> = {
    "REEL-01": "Authority",
    "REEL-02": "Authority",
    "REEL-03": "Education",
    "REEL-04": "Education",
    "REEL-05": "Social Proof",
    "REEL-06": "Social Proof",
    "REEL-07": "Behind the Scenes",
    "REEL-08": "Behind the Scenes",
    "REEL-09": "CTA",
    "REEL-10": "CTA",
  };
  return map[template] || "Authority";
}

function extractTitle(script: string): string {
  if (!script) return "";
  const lines = script.split("\n").filter((l) => l.trim());
  // Look for HOOK line or first non-heading line
  for (const line of lines) {
    if (line.toLowerCase().includes("hook")) {
      const content = line.replace(/\*\*HOOK\*\*:?/gi, "").replace(/#+/g, "").trim();
      if (content) return content;
    }
  }
  return lines[0]?.replace(/[#*]/g, "").trim() || "";
}

function extractHook(script: string): string {
  if (!script) return "";
  const match = script.match(/\*\*HOOK\*\*:?\s*(.+)/i);
  return match ? match[1].trim() : "";
}

function extractCTA(script: string): string {
  if (!script) return "";
  const match = script.match(/\*\*FECHAMENTO\*\*:?\s*(.+)/i);
  return match ? match[1].trim() : "";
}

function extractHashtags(script: string): string {
  if (!script) return "";
  const match = script.match(/\*\*HASHTAGS?\*\*:?\s*(.+)/i);
  return match ? match[1].trim() : "";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) : str;
}
