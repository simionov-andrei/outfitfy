import type { ClothingCategory, PriceTier, RetailMatch } from "./types";
import { TIER_BRANDS } from "./types";

const BASE_PRICE_BY_CATEGORY: Record<ClothingCategory, number> = {
  Outerwear: 220,
  Tops: 55,
  Knitwear: 90,
  Dresses: 140,
  Bottoms: 85,
  Denim: 95,
  Activewear: 65,
  Footwear: 150,
  Bags: 260,
  Accessories: 70,
  Jewelry: 110,
};

const TIER_MULTIPLIER: Record<PriceTier, [number, number]> = {
  luxury: [4.2, 7.5],
  premium: [1.1, 1.9],
  budget: [0.25, 0.55],
};

const RETAILER_BY_TIER: Record<PriceTier, string[]> = {
  luxury: ["Net-a-Porter", "Farfetch", "Mytheresa"],
  premium: ["Nordstrom", "Zalando", "ASOS Premium"],
  budget: ["Zara.com", "H&M", "Uniqlo"],
};

function randomBetween(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) / 5) * 5;
}

export function mockTieredMatches(
  category: ClothingCategory,
  colors: string[],
  name: string
): RetailMatch[] {
  const base = BASE_PRICE_BY_CATEGORY[category] ?? 80;
  const tiers: PriceTier[] = ["luxury", "premium", "budget"];

  return tiers.map((tier) => {
    const [min, max] = TIER_MULTIPLIER[tier];
    const price = randomBetween(base * min, base * max);
    const brands = TIER_BRANDS[tier];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const retailers = RETAILER_BY_TIER[tier];
    const retailer = retailers[Math.floor(Math.random() * retailers.length)];
    const slug = encodeURIComponent(`${colors[0] ?? ""} ${name}`.trim());

    return {
      tier,
      brand,
      productName: `${colors[0] ? colors[0][0].toUpperCase() + colors[0].slice(1) + " " : ""}${name}`,
      price,
      currency: "USD",
      url: `https://www.google.com/search?tbm=shop&q=${slug}+${encodeURIComponent(brand)}`,
      thumbnailUrl: "",
      matchConfidence: 0.6 + Math.random() * 0.35,
      retailer,
    } satisfies RetailMatch;
  });
}
