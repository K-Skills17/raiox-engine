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

  // Step 1: Search for the business on Google Maps
  const searchParams = new URLSearchParams({
    query,
    limit: "1",
    language: "pt",
    region: "BR",
  });

  const searchRes = await fetch(
    `${OUTSCRAPER_BASE}/maps/search-v3?${searchParams}`,
    {
      headers: { "X-API-KEY": apiKey },
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!searchRes.ok) {
    console.error("Outscraper search failed:", searchRes.status);
    return emptyGBP();
  }

  const searchData = await searchRes.json();
  const results = searchData?.data;

  if (!results || results.length === 0 || results[0].length === 0) {
    console.warn("No GBP results found for:", query);
    return emptyGBP();
  }

  const place = results[0][0];

  // Extract basic data from search
  const gbpData: GBPData = {
    gbp_photos: place.photos_count ?? place.photos?.length ?? null,
    gbp_last_reply_date: null,
    gbp_implant_featured: checkImplantFeatured(place.category || "", place.subtypes || []),
    gbp_rating: place.rating ?? null,
    gbp_review_count: place.reviews ?? null,
    gbp_name: place.name ?? null,
    gbp_categories: [
      ...(place.category ? [place.category] : []),
      ...(place.subtypes || []),
    ],
  };

  // Step 2: Get reviews to find last owner reply
  try {
    const reviewsParams = new URLSearchParams({
      query: place.place_id || query,
      reviewsLimit: "10",
      sort: "newest",
      language: "pt",
      region: "BR",
    });

    const reviewsRes = await fetch(
      `${OUTSCRAPER_BASE}/maps/reviews-v3?${reviewsParams}`,
      {
        headers: { "X-API-KEY": apiKey },
        signal: AbortSignal.timeout(30000),
      }
    );

    if (reviewsRes.ok) {
      const reviewsData = await reviewsRes.json();
      const reviewResults = reviewsData?.data;

      if (reviewResults && reviewResults.length > 0 && reviewResults[0].reviews_data) {
        const reviews = reviewResults[0].reviews_data;
        gbpData.gbp_last_reply_date = findLastReplyDate(reviews);
      }
    }
  } catch (e) {
    console.warn("Failed to fetch reviews:", e);
  }

  return gbpData;
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
