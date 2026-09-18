import "server-only";
import type { ClothingCategory, Season } from "../types";
import { CATEGORIES, SEASONS } from "../types";

export interface DetectedItem {
  category: ClothingCategory;
  colors: string[];
  fabric: string;
  pattern: string;
  seasons: Season[];
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  name: string;
  description: string;
}

export interface TaggingResult {
  items: DetectedItem[];
  usedModel: string;
}

const FABRICS = ["Cotton", "Wool", "Linen", "Silk", "Denim", "Leather", "Polyester blend", "Cashmere"];
const PATTERNS = ["Solid", "Striped", "Checked", "Floral", "Houndstooth", "Herringbone", "Graphic print"];
const COLOR_POOL = ["black", "white", "ivory", "beige", "camel", "navy", "blue", "denim", "red", "olive", "sage", "mustard", "grey", "charcoal"];

function pick<T>(arr: T[], n = 1): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

const SCHEMA_PROMPT = `You are a fashion vision system. Detect every distinct clothing/accessory item in the image.
Return ONLY valid JSON matching:
{"items":[{"name":string,"category":"Outerwear"|"Tops"|"Knitwear"|"Dresses"|"Bottoms"|"Denim"|"Activewear"|"Footwear"|"Bags"|"Accessories"|"Jewelry","colors":string[],"fabric":string,"pattern":string,"seasons":("Spring"|"Summer"|"Fall"|"Winter")[],"boundingBox":{"x":number,"y":number,"width":number,"height":number},"confidence":number,"description":string}]}
Bounding box coordinates are normalized 0-1 (x,y = top-left).
"description" must be a single detailed sentence describing exactly what this
specific item looks like — cut/silhouette, distinguishing graphics or text,
trim details, closures, texture — precise enough that someone could recreate
or shop for the exact piece from the sentence alone. Do not describe the
person wearing it or the surrounding scene.`;

/**
 * Detects and tags clothing items in an image.
 * Tries Gemini first (GEMINI_API_KEY — free tier at aistudio.google.com/apikey),
 * then OpenAI (OPENAI_API_KEY) if Gemini isn't configured, then falls back to
 * a structured mock detector so the ingestion pipeline always works without
 * any external API keys configured.
 */
export async function detectAndTagClothing(imageDataUrl: string): Promise<TaggingResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      return await callGemini(imageDataUrl, geminiKey);
    } catch (err) {
      console.error("[tagging] Gemini call failed, falling back:", err);
    }
  }

  if (openaiKey) {
    try {
      return await callOpenAI(imageDataUrl, openaiKey);
    } catch (err) {
      console.error("[tagging] OpenAI call failed, falling back to mock:", err);
    }
  }

  return mockTagging();
}

async function callGemini(imageDataUrl: string, apiKey: string): Promise<TaggingResult> {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  if (!match) throw new Error("Expected a base64 data URL image");
  const [, mimeType, base64Data] = match;

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: `${SCHEMA_PROMPT}\n\nTag every clothing item in this image.` },
          { inline_data: { mime_type: mimeType, data: base64Data } },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  });

  // The free tier occasionally returns a transient 503 ("high demand") —
  // worth a few retries with backoff before falling all the way back to
  // mock data (which starves segmentation of a real, precise box).
  const maxAttempts = 4;
  let res: Response | undefined;
  let lastError = "";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok) break;
    lastError = `${res.status} ${await res.text()}`;
    if (res.status !== 503 || attempt === maxAttempts - 1) break;
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }

  if (!res || !res.ok) throw new Error(`Gemini vision request failed: ${lastError}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  const parsed = JSON.parse(text);
  return { items: parsed.items ?? [], usedModel: model };
}

async function callOpenAI(imageDataUrl: string, apiKey: string): Promise<TaggingResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SCHEMA_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Tag every clothing item in this image." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      max_tokens: 1200,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI vision request failed: ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return { items: parsed.items ?? [], usedModel: "gpt-4o-mini" };
}

function mockTagging(): TaggingResult {
  const count = 1 + Math.floor(Math.random() * 3);
  const items: DetectedItem[] = Array.from({ length: count }).map((_, i) => {
    const category = pick(CATEGORIES)[0];
    const colors = pick(COLOR_POOL, 1 + Math.floor(Math.random() * 2));
    const fabric = pick(FABRICS)[0];
    const pattern = pick(PATTERNS)[0];
    return {
      name: `${category} item`,
      category,
      colors,
      fabric,
      pattern,
      seasons: pick(SEASONS, 1 + Math.floor(Math.random() * 2)) as Season[],
      boundingBox: {
        x: 0.1 + i * 0.05,
        y: 0.1 + i * 0.1,
        width: 0.5,
        height: 0.5,
      },
      confidence: 0.75 + Math.random() * 0.2,
      description: `A ${pattern.toLowerCase()} ${colors.join(" and ")} ${fabric.toLowerCase()} ${category.toLowerCase()}.`,
    };
  });
  return { items, usedModel: "mock-detector" };
}
