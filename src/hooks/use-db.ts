"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function useClosetItems() {
  return useLiveQuery(() => db.closetItems.orderBy("createdAt").reverse().toArray(), [], []);
}

export function useInspirationLooks() {
  return useLiveQuery(() => db.inspirationLooks.toArray(), [], []);
}

export function useIngestJobs() {
  return useLiveQuery(() => db.ingestJobs.orderBy("createdAt").reverse().toArray(), [], []);
}

export function usePlannerEntries(weekStartIso: string, weekEndIso: string) {
  return useLiveQuery(
    () =>
      db.plannerEntries
        .where("date")
        .between(weekStartIso, weekEndIso, true, true)
        .toArray(),
    [weekStartIso, weekEndIso],
    []
  );
}

export function useModelPhotos() {
  return useLiveQuery(() => db.modelPhotos.orderBy("createdAt").reverse().toArray(), [], []);
}

export function useOutfits() {
  return useLiveQuery(() => db.outfits.orderBy("createdAt").reverse().toArray(), [], []);
}
