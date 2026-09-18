import "server-only";
import sharp from "sharp";

// Shape returned by SAM3's per-prompt result JSON file (fetched from the
// `results` URL in its prediction output). Masks are dense binary bitmaps
// at a fixed 1024x1024 resolution regardless of the source image size;
// boxes are absolute pixel coordinates in that same 1024x1024 space.
interface Sam3PromptResult {
  masks: number[][][][]; // [detection][1][maskHeight][maskWidth], values 0|1
  boxes: number[][]; // [detection] -> [x1, y1, x2, y2] in mask-pixel space
  scores: number[];
}

export function dataUrlToBuffer(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.*)$/);
  if (!match) throw new Error("Expected a base64 image data URL");
  return Buffer.from(match[1], "base64");
}

/**
 * Fetches a SAM3 mask result, applies the highest-confidence mask as the
 * alpha channel of the original image, and crops to the detected bounding
 * box (with a little padding) — producing an actual clean, background-
 * removed, product-style transparent PNG rather than raw mask/JSON data.
 */
export async function compositeGarmentCutout(
  originalImageBuffer: Buffer,
  sam3ResultUrl: string
): Promise<Buffer> {
  const res = await fetch(sam3ResultUrl);
  if (!res.ok) throw new Error(`Failed to fetch SAM3 mask result: ${res.status}`);
  const result = (await res.json()) as Sam3PromptResult;

  if (!result.masks?.length || !result.scores?.length) {
    throw new Error("SAM3 result contained no masks");
  }

  let bestIdx = 0;
  for (let i = 1; i < result.scores.length; i++) {
    if (result.scores[i] > result.scores[bestIdx]) bestIdx = i;
  }

  const mask2d = result.masks[bestIdx][0];
  const maskH = mask2d.length;
  const maskW = mask2d[0].length;
  const [bx1, by1, bx2, by2] = result.boxes[bestIdx];

  const maskBuffer = Buffer.alloc(maskW * maskH);
  for (let y = 0; y < maskH; y++) {
    const row = mask2d[y];
    for (let x = 0; x < maskW; x++) {
      maskBuffer[y * maskW + x] = row[x] ? 255 : 0;
    }
  }

  const meta = await sharp(originalImageBuffer).metadata();
  const origW = meta.width!;
  const origH = meta.height!;

  // Nearest-neighbor keeps the mask's hard edges instead of blurring them
  // when scaling from the model's fixed 1024x1024 space to the source image.
  // Sharp silently promotes a 1-channel raw buffer to 3-channel (R=G=B) by
  // the time it comes back out of resize+raw — read the actual channel
  // count it reports rather than assuming 1, or every alpha read after that
  // is misaligned garbage (this was the bug producing a scrambled result).
  const { data: resizedMask, info: maskInfo } = await sharp(maskBuffer, {
    raw: { width: maskW, height: maskH, channels: 1 },
  })
    // fit: "fill" stretches to the exact target size instead of sharp's
    // default "cover" crop-to-fit — required since the mask is always a
    // fixed square (1024x1024) but source photos usually aren't, and our
    // box-coordinate math assumes a simple linear stretch, not a crop.
    .resize(origW, origH, { kernel: "nearest", fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: rgba } = await sharp(originalImageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < origW * origH; i++) {
    rgba[i * 4 + 3] = resizedMask[i * maskInfo.channels];
  }

  const scaleX = origW / maskW;
  const scaleY = origH / maskH;
  const pad = 0.06;
  const boxW = (bx2 - bx1) * scaleX;
  const boxH = (by2 - by1) * scaleY;
  const left = Math.max(0, Math.round(bx1 * scaleX - boxW * pad));
  const top = Math.max(0, Math.round(by1 * scaleY - boxH * pad));
  const width = Math.max(1, Math.min(origW - left, Math.round(boxW * (1 + 2 * pad))));
  const height = Math.max(1, Math.min(origH - top, Math.round(boxH * (1 + 2 * pad))));

  return sharp(rgba, { raw: { width: origW, height: origH, channels: 4 } })
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
}
