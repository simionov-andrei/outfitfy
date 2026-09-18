import Dexie, { type EntityTable } from "dexie";
import type {
  ClosetItem,
  Outfit,
  PlannerEntry,
  InspirationLook,
  PinterestBoard,
  IngestJob,
  ModelPhoto,
  VtoResult,
} from "./types";

class OutfitfyDB extends Dexie {
  closetItems!: EntityTable<ClosetItem, "id">;
  outfits!: EntityTable<Outfit, "id">;
  plannerEntries!: EntityTable<PlannerEntry, "id">;
  inspirationLooks!: EntityTable<InspirationLook, "id">;
  pinterestBoards!: EntityTable<PinterestBoard, "id">;
  ingestJobs!: EntityTable<IngestJob, "id">;
  modelPhotos!: EntityTable<ModelPhoto, "id">;
  vtoResults!: EntityTable<VtoResult, "id">;

  constructor() {
    super("outfitfy-db");

    this.version(1).stores({
      closetItems: "id, category, sourceType, favorite, createdAt, *colors, *seasons",
      outfits: "id, createdAt, generatedBy",
      plannerEntries: "id, date, outfitId",
      inspirationLooks: "id, aesthetic, *tags",
      pinterestBoards: "id, name",
      ingestJobs: "id, status, createdAt",
      modelPhotos: "id, createdAt",
      vtoResults: "id, modelPhotoId, createdAt",
    });
  }
}

export const db = new OutfitfyDB();

export async function resetLocalDatabase() {
  await db.delete();
  window.location.reload();
}
