import "server-only";
import type { ClothingCategory, PriceTier, RetailMatch } from "../types";
import { TIER_BRANDS } from "../types";
import { mockTieredMatches } from "../mockRetail";

/**
 * Runs a tiered retail search for a segmented garment, matching it against
 * real purchasable products in three price tiers.
 *
 * Prefers SerpApi (SERPAPI_API_KEY — free tier): a short, keyword-style text
 * query built from the item's structured tags via Google Shopping, merged
 * with a genuine reverse-image search via Google Lens when a public
 * thumbnail URL is available (the AI-generated product photo, once it's
 * been uploaded to Replicate's public delivery CDN — not the base64 cutout,
 * which Lens can't fetch). Falls back to a custom aggregator endpoint
 * (RETAIL_SEARCH_API_KEY + RETAIL_SEARCH_ENDPOINT) if you wire one up, then
 * to realistic mock matches, so every item always has a High-End /
 * Mid-Range / Budget purchase option.
 *
 * Deliberately does NOT use the item's full natural-language `description`
 * as the search query — a shopping search engine wants concise keywords,
 * and a prose sentence tends to over-index on one incidental detail (a
 * logo, a graphic) and skew results toward that instead of generically
 * similar products. The description is still used for thumbnail generation,
 * just not here.
 */
export async function findTieredMatches(
  category: ClothingCategory,
  colors: string[],
  fabric: string,
  name: string,
  pattern?: string,
  publicImageUrl?: string
): Promise<RetailMatch[]> {
  const serpApiKey = process.env.SERPAPI_API_KEY;
  if (serpApiKey) {
    try {
      const query = [colors[0], pattern, fabric, name].filter(Boolean).join(" ").trim() || name;
      const [shopping, visual] = await Promise.all([
        callSerpApiShopping(query, serpApiKey).catch((err) => {
          console.error("[retail] Google Shopping search failed:", err);
          return [];
        }),
        publicImageUrl && /^https?:\/\//.test(publicImageUrl)
          ? callSerpApiLens(publicImageUrl, serpApiKey).catch((err) => {
              console.error("[retail] Google Lens search failed:", err);
              return [];
            })
          : Promise.resolve([]),
      ]);

      // Visual matches first — a real reverse-image search on the actual
      // generated product photo is a stronger signal than a text query.
      const merged = [...visual, ...shopping];
      if (merged.length > 0) {
        const matches = bucketIntoTiers(merged, category, colors, name);
        if (matches.length > 0) return matches;
      }
    } catch (err) {
      console.error("[retail] SerpApi call failed, falling back:", err);
    }
  }

  const apiKey = process.env.RETAIL_SEARCH_API_KEY;
  const endpoint = process.env.RETAIL_SEARCH_ENDPOINT;
  if (apiKey && endpoint) {
    try {
      return await callRetailAggregator(category, colors, fabric, name, apiKey, endpoint);
    } catch (err) {
      console.error("[retail] Aggregator call failed, falling back to mock:", err);
    }
  }

  return mockTieredMatches(category, colors, name);
}

// -- The mock generator itself lives in ../mockRetail so it can also be
// reused client-side to build pre-seeded inspiration/demo data. --

interface NormalizedResult {
  title: string;
  source?: string;
  price: number;
  link?: string;
  thumbnail?: string;
}

async function callSerpApiShopping(query: string, apiKey: string): Promise<NormalizedResult[]> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", "30");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`SerpApi Shopping request failed: ${res.status}`);
  const data = await res.json();
  const results = (data.shopping_results ?? []) as Array<{
    title: string;
    source?: string;
    price?: string;
    extracted_price?: number;
    link?: string;
    product_link?: string;
    thumbnail?: string;
  }>;

  return results
    .map((r) => ({
      title: r.title,
      source: r.source,
      price: r.extracted_price ?? parsePrice(r.price) ?? 0,
      link: r.product_link ?? r.link,
      thumbnail: r.thumbnail,
    }))
    .filter((r) => r.price > 0);
}

/** Reverse-image search via Google Lens on a real, publicly-hosted image URL. */
async function callSerpApiLens(imageUrl: string, apiKey: string): Promise<NormalizedResult[]> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_lens");
  url.searchParams.set("url", imageUrl);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`SerpApi Lens request failed: ${res.status}`);
  const data = await res.json();
  const results = (data.visual_matches ?? []) as Array<{
    title: string;
    source?: string;
    price?: { extracted_value?: number; value?: string };
    link?: string;
    thumbnail?: string;
  }>;

  return results
    .map((r) => ({
      title: r.title,
      source: r.source,
      price: r.price?.extracted_value ?? parsePrice(r.price?.value) ?? 0,
      link: r.link,
      thumbnail: r.thumbnail,
    }))
    .filter((r) => r.price > 0);
}

function parsePrice(raw?: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Assigns each real result to a tier: first by matching the retailer/source
 * name against our known luxury/premium/budget brand lists, then fills any
 * still-empty tier by price percentile (highest -> luxury, middle ->
 * premium, lowest -> budget) among the remaining results.
 */
function bucketIntoTiers(
  results: NormalizedResult[],
  category: ClothingCategory,
  colors: string[],
  name: string
): RetailMatch[] {
  const chosen = new Map<PriceTier, NormalizedResult>();
  const remaining = [...results];

  for (const tier of ["luxury", "premium", "budget"] as PriceTier[]) {
    const brandNames = TIER_BRANDS[tier].map((b) => b.toLowerCase());
    const idx = remaining.findIndex((r) => brandNames.some((b) => r.source?.toLowerCase().includes(b)));
    if (idx !== -1) {
      chosen.set(tier, remaining[idx]);
      remaining.splice(idx, 1);
    }
  }

  const sortedByPrice = [...remaining].sort((a, b) => b.price - a.price);
  if (!chosen.has("luxury") && sortedByPrice.length > 0) {
    chosen.set("luxury", sortedByPrice.shift()!);
  }
  if (!chosen.has("budget") && sortedByPrice.length > 0) {
    chosen.set("budget", sortedByPrice.pop()!);
  }
  if (!chosen.has("premium") && sortedByPrice.length > 0) {
    chosen.set("premium", sortedByPrice[Math.floor(sortedByPrice.length / 2)]);
  }

  const matches: RetailMatch[] = [];
  for (const tier of ["luxury", "premium", "budget"] as PriceTier[]) {
    const r = chosen.get(tier);
    if (!r) continue;
    matches.push({
      tier,
      brand: r.source ?? "Unknown",
      productName: r.title,
      price: Math.round(r.price),
      currency: "USD",
      url: r.link ?? "",
      thumbnailUrl: r.thumbnail ?? "",
      matchConfidence: 0.55 + Math.random() * 0.3,
      retailer: r.source ?? "Google Shopping",
    });
  }

  // Fill any tier the real search couldn't cover with a mock match so the
  // UI never shows a blank slot.
  if (matches.length < 3) {
    const covered = new Set(matches.map((m) => m.tier));
    const fallback = mockTieredMatches(category, colors, name).filter((m) => !covered.has(m.tier));
    matches.push(...fallback);
  }

  return matches;
}

async function callRetailAggregator(
  category: ClothingCategory,
  colors: string[],
  fabric: string,
  name: string,
  apiKey: string,
  endpoint: string
): Promise<RetailMatch[]> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query: `${colors.join(" ")} ${fabric} ${name} ${category}` }),
  });
  if (!res.ok) throw new Error(`Retail search failed: ${res.status}`);
  const data = await res.json();
  return data.matches as RetailMatch[];
}
