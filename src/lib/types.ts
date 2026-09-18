export type ClothingCategory =
  | "Outerwear"
  | "Tops"
  | "Knitwear"
  | "Dresses"
  | "Bottoms"
  | "Denim"
  | "Activewear"
  | "Footwear"
  | "Bags"
  | "Accessories"
  | "Jewelry";

export type Season = "Spring" | "Summer" | "Fall" | "Winter";

export type PriceTier = "luxury" | "premium" | "budget";

export const TIER_LABELS: Record<PriceTier, string> = {
  luxury: "High-End / Luxury",
  premium: "Mid-Range / Premium",
  budget: "Budget / Fast-Fashion",
};

export const TIER_BRANDS: Record<PriceTier, string[]> = {
  luxury: ["Valentino", "Gucci", "Prada", "Saint Laurent", "Bottega Veneta"],
  premium: ["Massimo Dutti", "COS", "Abercrombie & Fitch", "Reiss", "& Other Stories"],
  budget: ["Zara", "H&M", "Uniqlo", "Mango", "Pull&Bear"],
};

export interface RetailMatch {
  tier: PriceTier;
  brand: string;
  productName: string;
  price: number;
  currency: string;
  url: string;
  thumbnailUrl: string;
  matchConfidence: number; // 0-1
  retailer: string;
}

export type IngestSourceType = "upload" | "pinterest" | "inspiration" | "manual";

export interface ClosetItem {
  id: string;
  name: string;
  category: ClothingCategory;
  colors: string[];
  fabric: string;
  pattern: string;
  seasons: Season[];
  description: string; // rich visual description — feeds thumbnail generation + retail search
  imageUrl: string; // final displayed thumbnail — AI-generated product photo when available
  segmentedImageUrl?: string; // the raw SAM3 cutout, before thumbnail generation
  originalImageUrl?: string;
  sourceType: IngestSourceType;
  sourceUrl?: string;
  retailMatches: RetailMatch[];
  estimatedValue: number; // heuristic base value, avg of matches
  wearCount: number;
  lastWornAt?: string;
  favorite: boolean;
  createdAt: string;
  notes?: string;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  imageUrl?: string; // VTO generated composite
  occasion?: string;
  createdAt: string;
  generatedBy: "manual" | "ai";
}

export interface PlannerEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  outfitId?: string;
  itemIds: string[];
  note?: string;
  generatedBy: "manual" | "ai";
}

export interface InspirationLook {
  id: string;
  title: string;
  aesthetic: string;
  imageUrl: string;
  tags: string[];
  items: Array<{
    name: string;
    category: ClothingCategory;
    colors: string[];
    fabric: string;
    pattern: string;
    seasons: Season[];
    imageUrl: string;
    retailMatches: RetailMatch[];
  }>;
}

export interface PinterestBoard {
  id: string;
  name: string;
  imageUrl: string;
  pinCount: number;
}

export type IngestStatus =
  | "queued"
  | "tagging"
  | "segmenting"
  | "generating"
  | "matching"
  | "done"
  | "error";

export interface IngestJob {
  id: string;
  sourceType: IngestSourceType;
  sourceLabel: string;
  imageUrl: string;
  status: IngestStatus;
  progress: number;
  resultItemIds: string[];
  error?: string;
  createdAt: string;
}

export interface ModelPhoto {
  id: string;
  imageUrl: string;
  label: string;
  createdAt: string;
}

export interface VtoResult {
  id: string;
  modelPhotoId: string;
  itemIds: string[];
  imageUrl: string;
  createdAt: string;
}

export const CATEGORIES: ClothingCategory[] = [
  "Outerwear",
  "Tops",
  "Knitwear",
  "Dresses",
  "Bottoms",
  "Denim",
  "Activewear",
  "Footwear",
  "Bags",
  "Accessories",
  "Jewelry",
];

export const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
