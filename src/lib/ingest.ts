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
 *  A) Detection & Tagging (vision LLM) — includes a detailed description per item
 *  B) Segmentation (background removal -> transparent cutout)
 *  C) AI thumbnail generation (polished product photo, guided by the description)
 *  D) Tiered retail matching (text description + the generated photo when public)
 *  E) Save into the local digital closet
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

    await patchJob(jobId, { status: "segmenting", progress: 30 });

    const resultItemIds: string[] = [];
    for (let i = 0; i < detected.length; i++) {
      const d = detected[i];
      const stepBase = 30 + Math.round((i / detected.length) * 65);
      const stepSpan = Math.round(65 / detected.length);

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
      const { imageUrl: segmentedUrl, usedModel: segmentationModel } = await segRes.json();

      await patchJob(jobId, { status: "generating", progress: stepBase + Math.round(stepSpan * 0.4) });

      // Skip the (paid, guaranteed-to-fail) generation call entirely when
      // segmentation itself already fell back to a mock SVG placeholder —
      // flux-kontext-pro only accepts jpeg/png/gif/webp reference images.
      let thumbnailUrl = segmentedUrl;
      let thumbnailPublicUrl: string | undefined;
      if (segmentationModel === "segment-anything") {
        const thumbRes = await fetch("/api/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: segmentedUrl, description: d.description, fabric: d.fabric }),
        });
        if (!thumbRes.ok) throw new Error("Thumbnail generation failed");
        ({ imageUrl: thumbnailUrl, publicUrl: thumbnailPublicUrl } = await thumbRes.json());
      }

      await patchJob(jobId, { status: "matching", progress: stepBase + Math.round(stepSpan * 0.7) });

      const matchRes = await fetch("/api/retail-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: d.category,
          colors: d.colors,
          fabric: d.fabric,
          name: d.name,
          // Structured, keyword-style tags only — not the free-text
          // description, which reads more like a sentence than a shopping
          // query and over-indexes search results on incidental details.
          pattern: d.pattern,
          // The (temporary, unpersisted) public Replicate URL — the stored
          // imageUrl is now always a data URL, which Google Lens can't fetch.
          publicImageUrl: thumbnailPublicUrl,
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
        description: d.description,
        imageUrl: thumbnailUrl,
        segmentedImageUrl: segmentedUrl,
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
        progress: stepBase + stepSpan,
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
