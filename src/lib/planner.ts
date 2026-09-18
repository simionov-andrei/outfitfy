import { addDays, format } from "date-fns";
import type { ClosetItem, PlannerEntry, Season } from "./types";

const TOP_LIKE = new Set(["Tops", "Knitwear", "Dresses"]);
const OUTERWEAR = "Outerwear";
const BOTTOM_LIKE = new Set(["Bottoms", "Denim"]);
const FOOTWEAR = "Footwear";
const LAYER_EXTRAS = new Set(["Bags", "Accessories", "Jewelry"]);

function currentSeason(date: Date): Season {
  const m = date.getMonth();
  if (m <= 1 || m === 11) return "Winter";
  if (m <= 4) return "Spring";
  if (m <= 7) return "Summer";
  return "Fall";
}

function weightFor(item: ClosetItem) {
  // Prioritize underused pieces: fewer wears -> higher weight ("no forgotten pieces").
  const base = 1 / (1 + item.wearCount);
  const recencyBoost = item.lastWornAt
    ? Math.min(2, (Date.now() - new Date(item.lastWornAt).getTime()) / (1000 * 60 * 60 * 24 * 14))
    : 1.5;
  return base * 2 + recencyBoost * 0.5 + (item.favorite ? 0.3 : 0);
}

function weightedPick<T extends ClosetItem>(pool: T[], exclude: Set<string>): T | null {
  const candidates = pool.filter((i) => !exclude.has(i.id));
  if (candidates.length === 0) return null;
  const weights = candidates.map(weightFor);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

function seasonMatch(item: ClosetItem, season: Season) {
  return item.seasons.length === 0 || item.seasons.includes(season);
}

export interface GeneratedOutfit {
  date: string;
  itemIds: string[];
  label: string;
}

export function generateWeeklyPlan(
  closet: ClosetItem[],
  weekStart: Date
): GeneratedOutfit[] {
  const plans: GeneratedOutfit[] = [];
  let previousDayIds = new Set<string>();

  for (let d = 0; d < 7; d++) {
    const date = addDays(weekStart, d);
    const season = currentSeason(date);
    const seasonalCloset = closet.filter((i) => seasonMatch(i, season));
    const pool = seasonalCloset.length >= 4 ? seasonalCloset : closet;

    const chosen: ClosetItem[] = [];
    const usedIds = new Set(previousDayIds);

    const dress = pool.filter((i) => i.category === "Dresses");
    const useDress = dress.length > 0 && Math.random() < 0.35;

    if (useDress) {
      const item = weightedPick(dress, usedIds);
      if (item) chosen.push(item);
    } else {
      const top = weightedPick(
        pool.filter((i) => TOP_LIKE.has(i.category) && i.category !== "Dresses"),
        usedIds
      );
      if (top) chosen.push(top);
      const bottom = weightedPick(
        pool.filter((i) => BOTTOM_LIKE.has(i.category)),
        usedIds
      );
      if (bottom) chosen.push(bottom);
    }

    if ((season === "Fall" || season === "Winter") && Math.random() < 0.6) {
      const outer = weightedPick(
        pool.filter((i) => i.category === OUTERWEAR),
        usedIds
      );
      if (outer) chosen.push(outer);
    }

    const shoes = weightedPick(
      pool.filter((i) => i.category === FOOTWEAR),
      usedIds
    );
    if (shoes) chosen.push(shoes);

    if (Math.random() < 0.5) {
      const extra = weightedPick(
        pool.filter((i) => LAYER_EXTRAS.has(i.category)),
        usedIds
      );
      if (extra) chosen.push(extra);
    }

    const itemIds = chosen.map((i) => i.id);
    plans.push({
      date: format(date, "yyyy-MM-dd"),
      itemIds,
      label: `${season} outfit for ${format(date, "EEEE")}`,
    });

    previousDayIds = new Set(itemIds);
  }

  return plans;
}

export function toPlannerEntries(plans: GeneratedOutfit[]): PlannerEntry[] {
  return plans.map((p) => ({
    id: p.date, // one entry per calendar day — upsert-friendly primary key
    date: p.date,
    itemIds: p.itemIds,
    note: p.label,
    generatedBy: "ai" as const,
  }));
}

export function computeUnderutilized(closet: ClosetItem[], limit = 6) {
  return [...closet].sort((a, b) => weightFor(b) - weightFor(a)).slice(0, limit);
}
