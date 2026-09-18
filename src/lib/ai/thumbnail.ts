import "server-only";
import { runReplicatePrediction, firstOutputUrl } from "./replicate";

// A stable, known-good version of black-forest-labs/flux-kontext-pro — an
// image-editing model that takes a reference image + text instruction and
// returns a new image. Overridable via REPLICATE_THUMBNAIL_MODEL_VERSION.
const DEFAULT_THUMBNAIL_MODEL_VERSION =
  "897a70f5a7dbd8a0611413b3b98cf417b45f266bd595c571a22947619d9ae462";

export interface ThumbnailResult {
  imageUrl: string; // permanent data: URL — safe to persist in the local closet
  publicUrl?: string; // the original Replicate CDN URL — EXPIRES; use immediately (e.g. reverse-image search) and never store it
  mocked: boolean;
}

export function buildThumbnailPrompt(description: string, fabric?: string): string {
  // The free-text description doesn't always mention material explicitly
  // (or the model's phrasing can drift), so state the tagged fabric
  // explicitly too — redundant on purpose, to keep the generated material
  // consistent with what was actually detected rather than whatever the
  // reference image's lighting/shadows might suggest.
  const materialNote = fabric ? ` The material is ${fabric}, rendered accurately as such — not any other material.` : "";
  return (
    `Professional e-commerce product photography of: ${description}${materialNote} ` +
    `Isolated on a clean, pure white studio background. Centered, soft even ` +
    `studio lighting, sharp focus, realistic fabric texture and true color, ` +
    `no model, no mannequin, no hangers, no shadows, no text or watermark, ` +
    `high-resolution catalog photo.`
  );
}

/**
 * Generates a polished, realistic product-photo thumbnail for a segmented
 * garment cutout, guided by its detailed description. Uses the cutout as a
 * reference image so the generated result stays faithful to the actual
 * piece (color, print, silhouette) rather than inventing a generic one.
 * Falls back to returning the cutout itself, unmodified, when Replicate
 * isn't configured — the pipeline still works end-to-end without this step.
 */
export async function generateProductThumbnail(
  cutoutImageDataUrl: string,
  description: string,
  fabric?: string
): Promise<ThumbnailResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  const version = process.env.REPLICATE_THUMBNAIL_MODEL_VERSION || DEFAULT_THUMBNAIL_MODEL_VERSION;

  if (token) {
    try {
      const output = await runReplicatePrediction(token, version, {
        prompt: buildThumbnailPrompt(description, fabric),
        input_image: cutoutImageDataUrl,
        aspect_ratio: "match_input_image",
        output_format: "png",
        safety_tolerance: 2,
      });
      const publicUrl = firstOutputUrl(output);

      // Replicate's delivery URLs are temporary CDN links, not permanent
      // storage — this app is local-first, so persisting a link that can
      // expire would silently break closet images later. Download it once,
      // right now, and store the actual bytes as a data URL instead.
      const imageRes = await fetch(publicUrl);
      if (!imageRes.ok) throw new Error(`Failed to download generated image: ${imageRes.status}`);
      const buf = Buffer.from(await imageRes.arrayBuffer());
      const contentType = imageRes.headers.get("content-type") || "image/png";
      const imageUrl = `data:${contentType};base64,${buf.toString("base64")}`;

      return { imageUrl, publicUrl, mocked: false };
    } catch (err) {
      console.error("[thumbnail] Generation failed, falling back to raw cutout:", err);
    }
  }

  return { imageUrl: cutoutImageDataUrl, mocked: true };
}
