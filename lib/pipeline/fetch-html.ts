import * as cheerio from "cheerio";

const PROBLEMATIC_WORDS = [
  "indolor", "sem dor",
  "melhor clinica", "melhor implante", "melhor dentista",
  "promocao", "promoção", "desconto", "oferta especial",
  "garantido", "garantia de", "100% seguro",
];

const WHATSAPP_PATTERNS = [
  /wa\.me\//i,
  /api\.whatsapp\.com/i,
  /whatsapp\.com\/send/i,
  /chat\.whatsapp\.com/i,
];

const CRO_PATTERN = /CRO[\s-]?[A-Z]{2}\s*\d{4,7}/g;

export interface HTMLParseResult {
  title: string;
  text: string;
  excerpt: string;
  whatsappClicks: number;
  casesPresent: boolean;
  croVisible: boolean;
  croNumbers: string[];
  fetchMs: number;
  rawHtmlLength: number;
}

export async function fetchAndParseHTML(url: string): Promise<HTMLParseResult> {
  const t0 = Date.now();
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RaioXBot/1.0; +https://lkdigital.com.br)",
    },
    signal: AbortSignal.timeout(15000),
  });
  const fetchMs = Date.now() - t0;

  if (!res.ok) {
    throw new Error(`Fetch failed for ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Extract title before removing elements
  const title = $("title").text().trim() || $("h1").first().text().trim() || "";

  // Remove script and style tags before extracting text
  $("script, style, noscript").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();

  // WhatsApp — check if link is on the page
  const homeWhatsApp = WHATSAPP_PATTERNS.some((p) => p.test(html));
  const whatsappClicks = homeWhatsApp ? 1 : 3;

  // Cases present — heuristic
  const casesKeywords = [
    "caso",
    "depoimento",
    "antes e depois",
    "antes-e-depois",
    "transformação",
    "transformacao",
  ];
  const casesPresent =
    casesKeywords.some((k) => text.toLowerCase().includes(k)) &&
    $("img").length > 5;

  // CRO visible
  const croMatches = text.match(CRO_PATTERN) || [];
  const croVisible = croMatches.length > 0;

  return {
    title,
    text,
    excerpt: text.slice(0, 8000),
    whatsappClicks,
    casesPresent,
    croVisible,
    croNumbers: croMatches,
    fetchMs,
    rawHtmlLength: html.length,
  };
}

export function findProblematicWords(text: string): string[] {
  return PROBLEMATIC_WORDS.filter((w) =>
    text.toLowerCase().includes(w.toLowerCase())
  );
}
