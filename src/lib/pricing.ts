import type { ClosetItem, PriceTier } from "./types";

export interface TierTotals {
  luxury: number;
  premium: number;
  budget: number;
}

export function computeTierTotals(items: ClosetItem[]): TierTotals {
  const totals: TierTotals = { luxury: 0, premium: 0, budget: 0 };
  for (const item of items) {
    for (const tier of ["luxury", "premium", "budget"] as PriceTier[]) {
      const match = item.retailMatches.find((m) => m.tier === tier);
      totals[tier] += match?.price ?? 0;
    }
  }
  return totals;
}

export function computeCategoryBreakdown(items: ClosetItem[]) {
  const map = new Map<string, TierTotals>();
  for (const item of items) {
    const existing = map.get(item.category) ?? { luxury: 0, premium: 0, budget: 0 };
    for (const tier of ["luxury", "premium", "budget"] as PriceTier[]) {
      const match = item.retailMatches.find((m) => m.tier === tier);
      existing[tier] += match?.price ?? 0;
    }
    map.set(item.category, existing);
  }
  return Array.from(map.entries()).map(([category, totals]) => ({ category, ...totals }));
}

export function averageEstimatedValue(item: ClosetItem) {
  const premium = item.retailMatches.find((m) => m.tier === "premium");
  if (premium) return premium.price;
  const prices = item.retailMatches.map((m) => m.price);
  if (prices.length === 0) return 0;
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}
