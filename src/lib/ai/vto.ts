import "server-only";

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
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input: {
        human_img: input.modelImageDataUrl,
        garm_img: input.garmentImageDataUrls[0],
      },
    }),
  });
  if (!createRes.ok) throw new Error(`Replicate create failed: ${createRes.status}`);
  const prediction = await createRes.json();

  let result = prediction;
  for (let i = 0; i < 40 && result.status !== "succeeded" && result.status !== "failed"; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Token ${token}` },
    });
    result = await poll.json();
  }

  if (result.status !== "succeeded") throw new Error("VTO generation did not complete");
  return Array.isArray(result.output) ? result.output[0] : result.output;
}
