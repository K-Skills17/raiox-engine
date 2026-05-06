const OUTSCRAPER_BASE = "https://api.app.outscraper.com";

export interface GBPData {
  gbp_photos: number | null;
  gbp_last_reply_date: string | null;
  gbp_implant_featured: boolean | null;
  gbp_rating: number | null;
  gbp_review_count: number | null;
  gbp_name: string | null;
  gbp_categories: string[];
}

export async function scrapeGBP(
  clinicName: string,
  city?: string
): Promise<GBPData> {
  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) {
    console.warn("OUTSCRAPER_API_KEY not set, skipping GBP scrape");
    return emptyGBP();
  }

  const query = city ? `${clinicName} ${city}` : clinicName;

  try {
    // Step 1: Search for the business on Google Maps
    const searchParams = new URLSearchParams({
      query,
      limit: "1",
      language: "pt",
      region: "BR",
      async: "false",
    });

    console.log("Outscraper: searching for", query);

    const searchRes = await fetch(
      `${OUTSCRAPER_BASE}/maps/search-v3?${searchParams}`,
      {
        headers: { "X-API-KEY": apiKey },
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!searchRes.ok) {
      console.error("Outscraper search failed:", searchRes.status, await searchRes.text());
      return emptyGBP();
    }

    let searchData = await searchRes.json();

    // Handle async response — poll until ready
    if (searchData.status === "Pending" && searchData.results_location) {
      console.log("Outscraper: polling for results...");
      searchData = await pollForResults(searchData.results_location, apiKey);
      if (!searchData) return emptyGBP();
    }

    const results = searchData?.data;

    if (!results || results.length === 0 || results[0].length === 0) {
      console.warn("No GBP results found for:", query);
      return emptyGBP();
    }

    const place = results[0][0];
    console.log("Outscraper: found", place.name);

    // Extract basic data from search
    const gbpData: GBPData = {
      gbp_photos: place.photos_count ?? place.photos?.length ?? null,
      gbp_last_reply_date: null,
      gbp_implant_featured: checkImplantFeatured(place.category || "", place.subtypes || []),
      gbp_rating: place.rating ?? null,
      gbp_review_count: place.reviews ?? place.reviews_count ?? null,
      gbp_name: place.name ?? null,
      gbp_categories: [
        ...(place.category ? [place.category] : []),
        ...(place.subtypes || []),
      ],
    };

    // Check reviews from search results (some plans include them)
    if (place.reviews_data && place.reviews_data.length > 0) {
      gbpData.gbp_last_reply_date = findLastReplyDate(place.reviews_data);
    }

    // Step 2: If no review reply found, fetch reviews separately
    if (!gbpData.gbp_last_reply_date) {
      try {
        const reviewsParams = new URLSearchParams({
          query: place.place_id || query,
          reviewsLimit: "10",
          sort: "newest",
          language: "pt",
          region: "BR",
          async: "false",
        });

        const reviewsRes = await fetch(
          `${OUTSCRAPER_BASE}/maps/reviews-v3?${reviewsParams}`,
          {
            headers: { "X-API-KEY": apiKey },
            signal: AbortSignal.timeout(60000),
          }
        );

        if (reviewsRes.ok) {
          let reviewsData = await reviewsRes.json();

          // Handle async response
          if (reviewsData.status === "Pending" && reviewsData.results_location) {
            reviewsData = await pollForResults(reviewsData.results_location, apiKey);
          }

          if (reviewsData) {
            const reviewResults = reviewsData.data;
            if (reviewResults && reviewResults.length > 0 && reviewResults[0].reviews_data) {
              gbpData.gbp_last_reply_date = findLastReplyDate(reviewResults[0].reviews_data);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch reviews:", e);
      }
    }

    return gbpData;
  } catch (e) {
    console.error("GBP scrape failed:", e);
    return emptyGBP();
  }
}

async function pollForResults(url: string, apiKey: string, maxAttempts = 15): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);

    try {
      const res = await fetch(url, {
        headers: { "X-API-KEY": apiKey },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const data = await res.json();

      if (data.status === "Success" || data.data) {
        return data;
      }

      if (data.status === "Error") {
        console.error("Outscraper request failed:", data);
        return null;
      }

      console.log(`Outscraper: still pending (attempt ${i + 1}/${maxAttempts})`);
    } catch {
      continue;
    }
  }

  console.warn("Outscraper: timed out waiting for results");
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkImplantFeatured(category: string, subtypes: string[]): boolean {
  const allCategories = [category, ...subtypes].join(" ").toLowerCase();
  const implantKeywords = [
    "implante",
    "implant",
    "implantodontia",
    "implantologia",
    "implantologista",
  ];
  return implantKeywords.some((k) => allCategories.includes(k));
}

function findLastReplyDate(reviews: any[]): string | null {
  let latestReply: string | null = null;

  for (const review of reviews) {
    if (review.response_datetime || review.owner_answer_timestamp) {
      const replyDate =
        review.response_datetime ||
        new Date(review.owner_answer_timestamp * 1000).toISOString().split("T")[0];

      if (!latestReply || replyDate > latestReply) {
        latestReply = replyDate;
      }
    }
  }

  return latestReply;
}

function emptyGBP(): GBPData {
  return {
    gbp_photos: null,
    gbp_last_reply_date: null,
    gbp_implant_featured: null,
    gbp_rating: null,
    gbp_review_count: null,
    gbp_name: null,
    gbp_categories: [],
  };
}
