import "server-only";
import { runReplicatePrediction, firstOutputUrl } from "./replicate";

export interface VtoInput {
  modelImageDataUrl: string;
  garmentImageDataUrls: string[];
}

/**
 * Generates a virtual try-on composite of the given garments layered onto
 * the model photo. Wired to a hosted IDM-VTON endpoint (e.g. on Replicate)
 * when REPLICATE_API_TOKEN + REPLICATE_VTON_MODEL_VERSION are configured.
 * Without those, returns a mocked result so the Try-On canvas still produces
 * a deterministic "generated" image end-to-end in local/offline dev.
 */
export async function generateVirtualTryOn(input: VtoInput): Promise<{ imageUrl: string; mocked: boolean }> {
  const token = process.env.REPLICATE_API_TOKEN;
  const version = process.env.REPLICATE_VTON_MODEL_VERSION;

  if (token && version) {
    try {
      const imageUrl = await callIdmVton(input, token, version);
      return { imageUrl, mocked: false };
    } catch (err) {
      console.error("[vto] IDM-VTON call failed, falling back to mock:", err);
    }
  }

  // Mock: no server-side canvas compositing dependency needed — the client
  // performs an approximate layered composite preview and simply echoes it
  // back so the UI flow (submit -> "AI generating" -> result) is realistic.
  return { imageUrl: input.modelImageDataUrl, mocked: true };
}

async function callIdmVton(input: VtoInput, token: string, version: string): Promise<string> {
  const output = await runReplicatePrediction(token, version, {
    human_img: input.modelImageDataUrl,
    garm_img: input.garmentImageDataUrls[0],
  });
  const publicUrl = firstOutputUrl(output);

  // Same rule as thumbnail generation: Replicate's delivery URL is
  // temporary. A saved outfit persists this image in IndexedDB, so it must
  // be a permanent data URL, not a link that can expire later.
  const imageRes = await fetch(publicUrl);
  if (!imageRes.ok) throw new Error(`Failed to download VTO result image: ${imageRes.status}`);
  const buf = Buffer.from(await imageRes.arrayBuffer());
  const contentType = imageRes.headers.get("content-type") || "image/png";
  return `data:${contentType};base64,${buf.toString("base64")}`;
}
