import "server-only";
import type { ClothingCategory, RetailMatch } from "../types";
import { mockTieredMatches } from "../mockRetail";

/**
 * Runs a tiered visual + text-query retail search for a segmented garment.
 * Calls a real aggregator (Lykdat / Google Lens-style) when RETAIL_SEARCH_API_KEY
 * is configured; otherwise generates realistic tiered mock matches so every
 * item in the closet always has a High-End / Mid-Range / Budget purchase option.
 */
export async function findTieredMatches(
  category: ClothingCategory,
  colors: string[],
  fabric: string,
  name: string
): Promise<RetailMatch[]> {
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
