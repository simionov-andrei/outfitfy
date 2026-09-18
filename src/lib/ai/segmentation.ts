import "server-only";
import sharp from "sharp";
import { garmentPlaceholder } from "../placeholder";
import { runReplicatePrediction } from "./replicate";
import { compositeGarmentCutout, dataUrlToBuffer } from "./maskComposite";
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

interface Sam3Output {
  results?: string[];
  visualizations?: string[];
}

/**
 * Gemini's structured output has been observed with inconsistent key
 * casing (e.g. `{"x":376,"Y":12,...}`) — a plain `box.y` read would
 * silently become `undefined` -> `NaN` all the way through the pipeline,
 * producing an API request with a literal NaN in it. Read case-insensitively
 * and require every field to end up a finite number, or reject outright.
 */
function sanitizeBox(box: BoundingBox): BoundingBox {
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(box as unknown as Record<string, unknown>)) {
    lower[k.toLowerCase()] = v;
  }
  const sanitized = {
    x: Number(lower.x),
    y: Number(lower.y),
    width: Number(lower.width),
    height: Number(lower.height),
  };
  if (!Object.values(sanitized).every(Number.isFinite)) {
    throw new Error(`Malformed bounding box (non-numeric field): ${JSON.stringify(box)}`);
  }
  return sanitized;
}

async function normalizeBoxToUnitRange(box: BoundingBox, imageDataUrl: string): Promise<BoundingBox> {
  const needsRescale = box.x > 1 || box.y > 1 || box.width > 1 || box.height > 1;
  let rescaled = box;

  if (needsRescale) {
    const meta = await sharp(dataUrlToBuffer(imageDataUrl)).metadata();
    const imgW = meta.width || 1;
    const imgH = meta.height || 1;
    // Real Gemini responses have been observed mixing units WITHIN one box
    // (e.g. x/width normalized but y in pixels, or vice versa) — decide
    // per field, not per box, or an already-correct field gets divided by
    // the image size too and collapses toward zero.
    rescaled = {
      x: box.x > 1 ? box.x / imgW : box.x,
      y: box.y > 1 ? box.y / imgH : box.y,
      width: box.width > 1 ? box.width / imgW : box.width,
      height: box.height > 1 ? box.height / imgH : box.height,
    };
  }

  // Even a genuinely normalized box can overshoot the image edge (the
  // failing real-world case had y + height > 1 even in pixel space, i.e.
  // Gemini's own box ran past the bottom of the photo) — clamp the whole
  // box into the unit square so x+width and y+height never exceed 1,
  // rather than only clamping each field independently.
  const x = clamp01(rescaled.x);
  const y = clamp01(rescaled.y);
  const width = Math.max(0, Math.min(rescaled.width, 1 - x));
  const height = Math.max(0, Math.min(rescaled.height, 1 - y));

  // A near-zero dimension (e.g. Gemini placing a box exactly on the image
  // edge with 0 height) gives SAM3 nothing to search — expand it to a
  // small minimum size around its own center instead of giving up outright,
  // so the model at least gets a real region to look at.
  const MIN_DIM = 0.08;
  const expand = (start: number, size: number): [number, number] => {
    if (size >= MIN_DIM) return [start, size];
    const center = start + size / 2;
    const newStart = clamp01(center - MIN_DIM / 2);
    return [newStart, Math.min(MIN_DIM, 1 - newStart)];
  };
  const [ex, ewidth] = expand(x, width);
  const [ey, eheight] = expand(y, height);

  return { x: ex, y: ey, width: ewidth, height: eheight };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

async function callSegmentAnything(
  imageDataUrl: string,
  box: BoundingBox,
  token: string,
  version: string
): Promise<string> {
  // The vision model is instructed to return boxes normalized to [0,1], but
  // real-world structured output isn't 100% reliable — it sometimes returns
  // raw pixel coordinates instead, or malformed keys. SAM3 hard-rejects (and
  // silently returns zero results for) anything outside 0-1 or NaN, so
  // sanitize and normalize defensively rather than trusting the model's own
  // instruction-following.
  const safeBox = sanitizeBox(box);
  const normalizedBox = await normalizeBoxToUnitRange(safeBox, imageDataUrl);

  // A degenerate (zero-area) box can't produce a meaningful mask — fail
  // fast rather than spending a real API call on a guaranteed-empty result.
  if (normalizedBox.width <= 0 || normalizedBox.height <= 0) {
    throw new Error(`Degenerate bounding box after normalization: ${JSON.stringify(normalizedBox)}`);
  }

  // SAM3 (vufinder/sam3) expects a `prompts` array of JSON-stringified
  // prompt objects; box coordinates are normalized [0,1] center-format
  // (center_x, center_y, width, height) — NOT corner coordinates.
  const centerX = normalizedBox.x + normalizedBox.width / 2;
  const centerY = normalizedBox.y + normalizedBox.height / 2;

  // A couple of retries with a short pause as a safety net for genuine
  // transient hiccups — the normalization above is the real fix, this just
  // covers residual flakiness.
  let resultUrl: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const output = (await runReplicatePrediction(
      token,
      version,
      {
        image: imageDataUrl,
        prompts: [
          JSON.stringify({
            positive_boxes: [[centerX, centerY, normalizedBox.width, normalizedBox.height]],
          }),
        ],
        confidence_threshold: 0.4,
      },
      30
    )) as Sam3Output;

    resultUrl = output.results?.[0];
    if (resultUrl) break;
    if (attempt < 2) await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
  }
  if (!resultUrl) throw new Error("SAM3 returned no result masks");

  // SAM3's own output is raw mask/JSON data, not a ready-to-use image — cut
  // the garment out of the original photo ourselves using that mask.
  const originalBuffer = dataUrlToBuffer(imageDataUrl);
  const cutoutBuffer = await compositeGarmentCutout(originalBuffer, resultUrl);
  return `data:image/png;base64,${cutoutBuffer.toString("base64")}`;
}
