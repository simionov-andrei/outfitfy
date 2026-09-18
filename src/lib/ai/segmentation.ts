import "server-only";
import { garmentPlaceholder } from "../placeholder";
import type { ClothingCategory } from "../types";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Segments a single detected garment out of the source image and returns a
 * clean, background-removed, product-style PNG (as a data URL).
 * Calls a hosted Segment Anything (SAM) endpoint when REPLICATE_API_TOKEN is
 * set; otherwise returns a deterministic placeholder swatch so the rest of
 * the pipeline (matching, closet ingestion) keeps working end-to-end.
 */
export async function segmentGarment(
  sourceImageDataUrl: string,
  box: BoundingBox,
  category: ClothingCategory,
  colors: string[],
  seed: string
): Promise<{ imageUrl: string; usedModel: string }> {
  const token = process.env.REPLICATE_API_TOKEN;
  const modelVersion = process.env.REPLICATE_SAM_MODEL_VERSION;

  if (token && modelVersion) {
    try {
      const imageUrl = await callSegmentAnything(sourceImageDataUrl, box, token, modelVersion);
      return { imageUrl, usedModel: "segment-anything" };
    } catch (err) {
      console.error("[segmentation] SAM call failed, falling back to mock:", err);
    }
  }

  return { imageUrl: garmentPlaceholder(category, colors, seed), usedModel: "mock-segmenter" };
}

async function callSegmentAnything(
  imageDataUrl: string,
  box: BoundingBox,
  token: string,
  version: string
): Promise<string> {
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input: {
        image: imageDataUrl,
        box_prompt: [box.x, box.y, box.x + box.width, box.y + box.height],
      },
    }),
  });
  if (!createRes.ok) throw new Error(`Replicate create failed: ${createRes.status}`);
  const prediction = await createRes.json();

  let result = prediction;
  for (let i = 0; i < 30 && result.status !== "succeeded" && result.status !== "failed"; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Token ${token}` },
    });
    result = await poll.json();
  }

  if (result.status !== "succeeded") throw new Error("Segmentation did not complete");
  return Array.isArray(result.output) ? result.output[0] : result.output;
}
