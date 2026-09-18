import "server-only";

/**
 * Replicate's classic /v1/predictions endpoint wants just the bare version
 * hash in the "version" field — not the "owner/model:hash" shorthand shown
 * in Replicate's own README snippets and copy-pasted into env vars. Accept
 * either and normalize to the hash.
 */
export function extractVersionHash(version: string): string {
  const idx = version.lastIndexOf(":");
  return idx === -1 ? version : version.slice(idx + 1);
}

/**
 * Creates a prediction and polls it to completion, returning the model's
 * raw `output` field as-is. Output shape varies per model (a plain URL
 * string, an array of URLs, or — as with SAM3 — a structured object) so
 * callers are responsible for interpreting it themselves.
 */
export async function runReplicatePrediction(
  token: string,
  version: string,
  input: Record<string, unknown>,
  maxPollAttempts = 40
): Promise<unknown> {
  // Accounts under $5 balance get throttled hard (6 req/min, burst 1) — with
  // two Replicate calls per garment now (segment + thumbnail), that limit is
  // easy to hit. Replicate tells us exactly how long to wait via
  // `retry_after`; honor it and retry instead of giving up on a transient 429.
  const maxRateLimitRetries = 4;
  let createRes: Response | undefined;
  let createBody = "";
  for (let attempt = 0; attempt <= maxRateLimitRetries; attempt++) {
    createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ version: extractVersionHash(version), input }),
    });
    if (createRes.ok) break;
    createBody = await createRes.text();
    if (createRes.status !== 429 || attempt === maxRateLimitRetries) break;
    const retryAfter = Number(JSON.parse(createBody || "{}")?.retry_after) || 5;
    await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
  }
  if (!createRes || !createRes.ok) {
    throw new Error(`Replicate create failed: ${createRes?.status} ${createBody}`);
  }
  const prediction = await createRes.json();

  let result = prediction;
  for (let i = 0; i < maxPollAttempts && result.status !== "succeeded" && result.status !== "failed" && result.status !== "canceled"; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Token ${token}` },
    });
    result = await poll.json();
  }

  if (result.status !== "succeeded") {
    throw new Error(
      `Replicate prediction did not succeed (status: ${result.status}): ${result.error ?? "no error detail returned"}`
    );
  }
  return result.output;
}

/** Convenience for models whose output is a plain URL string or a [url] array. */
export function firstOutputUrl(output: unknown): string {
  if (Array.isArray(output)) return output[0];
  return output as string;
}
