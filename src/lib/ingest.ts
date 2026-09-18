import { db } from "./db";
import type { ClosetItem, IngestJob, IngestSourceType } from "./types";

export async function createIngestJob(
  imageUrl: string,
  sourceType: IngestSourceType,
  sourceLabel: string
): Promise<IngestJob> {
  const job: IngestJob = {
    id: crypto.randomUUID(),
    sourceType,
    sourceLabel,
    imageUrl,
    status: "queued",
    progress: 0,
    resultItemIds: [],
    createdAt: new Date().toISOString(),
  };
  await db.ingestJobs.add(job);
  return job;
}

async function patchJob(id: string, patch: Partial<IngestJob>) {
  await db.ingestJobs.update(id, patch);
}

/**
 * Drives one ingestion job end-to-end:
 *  A) Detection & Tagging (vision LLM)
 *  B) Segmentation (background removal -> transparent product PNG)
 *  C) Tiered retail matching + save into the local digital closet
 */
export async function processIngestJob(jobId: string) {
  const job = await db.ingestJobs.get(jobId);
  if (!job) return;

  try {
    await patchJob(jobId, { status: "tagging", progress: 10 });
    const tagRes = await fetch("/api/vision/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: job.imageUrl }),
    });
    if (!tagRes.ok) throw new Error("Tagging failed");
    const { items: detected } = await tagRes.json();

    if (!detected || detected.length === 0) {
      await patchJob(jobId, { status: "error", error: "No clothing items detected." });
      return;
    }

    await patchJob(jobId, { status: "segmenting", progress: 40 });

    const resultItemIds: string[] = [];
    for (let i = 0; i < detected.length; i++) {
      const d = detected[i];

      const segRes = await fetch("/api/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: job.imageUrl,
          box: d.boundingBox,
          category: d.category,
          colors: d.colors,
          seed: `${jobId}-${i}`,
        }),
      });
      if (!segRes.ok) throw new Error("Segmentation failed");
      const { imageUrl: segmentedUrl } = await segRes.json();

      await patchJob(jobId, {
        status: "matching",
        progress: 40 + Math.round(((i + 0.5) / detected.length) * 40),
      });

      const matchRes = await fetch("/api/retail-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: d.category,
          colors: d.colors,
          fabric: d.fabric,
          name: d.name,
        }),
      });
      if (!matchRes.ok) throw new Error("Retail matching failed");
      const { matches } = await matchRes.json();

      const premiumMatch = matches.find((m: { tier: string }) => m.tier === "premium");

      const closetItem: ClosetItem = {
        id: crypto.randomUUID(),
        name: d.name,
        category: d.category,
        colors: d.colors,
        fabric: d.fabric,
        pattern: d.pattern,
        seasons: d.seasons,
        imageUrl: segmentedUrl,
        originalImageUrl: job.imageUrl,
        sourceType: job.sourceType,
        sourceUrl: job.sourceLabel,
        retailMatches: matches,
        estimatedValue: premiumMatch?.price ?? 0,
        wearCount: 0,
        favorite: false,
        createdAt: new Date().toISOString(),
      };

      await db.closetItems.add(closetItem);
      resultItemIds.push(closetItem.id);

      await patchJob(jobId, {
        progress: 40 + Math.round(((i + 1) / detected.length) * 55),
        resultItemIds,
      });
    }

    await patchJob(jobId, { status: "done", progress: 100, resultItemIds });
  } catch (err) {
    await patchJob(jobId, {
      status: "error",
      error: err instanceof Error ? err.message : "Ingestion failed",
    });
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
