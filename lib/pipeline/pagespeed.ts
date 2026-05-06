const PAGESPEED_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export interface PageSpeedResult {
  score: number;
  lcpSeconds: number;
  audits: Record<string, any>;
}

export interface PageSpeedData {
  mobile: PageSpeedResult;
  desktop: PageSpeedResult;
  raw: { mobile: any; desktop: any };
}

export async function runPageSpeed(url: string): Promise<PageSpeedData> {
  const [mobile, desktop] = await Promise.all([
    fetchSpeed(url, "mobile"),
    fetchSpeed(url, "desktop"),
  ]);
  return { mobile, desktop, raw: { mobile: mobile.raw, desktop: desktop.raw } };
}

async function fetchSpeed(
  url: string,
  strategy: "mobile" | "desktop"
): Promise<PageSpeedResult & { raw: any }> {
  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance",
  });

  if (process.env.PAGESPEED_API_KEY) {
    params.set("key", process.env.PAGESPEED_API_KEY);
  }

  const res = await fetch(`${PAGESPEED_ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`PageSpeed ${strategy} failed: ${res.status}`);
  }

  const data = await res.json();
  const lhResult = data.lighthouseResult || {};
  const audits = lhResult.audits || {};
  const score = Math.round(
    (lhResult.categories?.performance?.score || 0) * 100
  );

  const lcpDisplay = audits["largest-contentful-paint"]?.displayValue || "0";
  const lcpSeconds = parseFloat(lcpDisplay.replace(/[^0-9.]/g, "")) || 0;

  return { score, lcpSeconds, audits, raw: data };
}
