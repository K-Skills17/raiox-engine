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

const EMPTY_RESULT: PageSpeedResult & { raw: any } = {
  score: 0,
  lcpSeconds: 0,
  audits: {},
  raw: null,
};

export async function runPageSpeed(url: string): Promise<PageSpeedData> {
  const [mobile, desktop] = await Promise.allSettled([
    fetchSpeed(url, "mobile"),
    fetchSpeed(url, "desktop"),
  ]);

  const mobileResult = mobile.status === "fulfilled" ? mobile.value : EMPTY_RESULT;
  const desktopResult = desktop.status === "fulfilled" ? desktop.value : EMPTY_RESULT;

  if (mobile.status === "rejected") {
    console.warn("PageSpeed mobile failed:", mobile.reason?.message);
  }
  if (desktop.status === "rejected") {
    console.warn("PageSpeed desktop failed:", desktop.reason?.message);
  }

  return {
    mobile: mobileResult,
    desktop: desktopResult,
    raw: { mobile: mobileResult.raw, desktop: desktopResult.raw },
  };
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
