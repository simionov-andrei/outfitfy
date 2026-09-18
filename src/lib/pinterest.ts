import type { PinterestBoard } from "./types";
import { lookPlaceholder } from "./placeholder";

const PINTEREST_AUTH_URL = "https://www.pinterest.com/oauth/";
const PINTEREST_TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";
const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

export function isPinterestConfigured() {
  return Boolean(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET);
}

export function buildPinterestAuthUrl(redirectUri: string, state: string) {
  const clientId = process.env.PINTEREST_CLIENT_ID!;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "boards:read,pins:read",
    state,
  });
  return `${PINTEREST_AUTH_URL}?${params.toString()}`;
}

export async function exchangePinterestCode(code: string, redirectUri: string) {
  const clientId = process.env.PINTEREST_CLIENT_ID!;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(PINTEREST_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) throw new Error(`Pinterest token exchange failed: ${res.status}`);
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

export async function fetchPinterestBoards(accessToken: string): Promise<PinterestBoard[]> {
  const res = await fetch(`${PINTEREST_API_BASE}/boards?page_size=25`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Pinterest boards request failed: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((b: { id: string; name: string; media?: { image_cover_url?: string }; pin_count?: number }) => ({
    id: b.id,
    name: b.name,
    imageUrl: b.media?.image_cover_url ?? "",
    pinCount: b.pin_count ?? 0,
  }));
}

export async function fetchPinterestPins(accessToken: string, boardId: string) {
  const res = await fetch(`${PINTEREST_API_BASE}/boards/${boardId}/pins?page_size=25`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Pinterest pins request failed: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((p: { id: string; media?: { images?: Record<string, { url: string }> } }) => ({
    id: p.id,
    imageUrl: p.media?.images?.["1200x"]?.url ?? Object.values(p.media?.images ?? {})[0]?.url ?? "",
  }));
}

// ---- Mock fallback (used when PINTEREST_CLIENT_ID/SECRET are not set) ----

const MOCK_BOARD_NAMES = ["Fall Capsule", "Old Money Aesthetic", "Streetwear Fits", "Wedding Guest", "Weekend Basics"];

export function mockPinterestBoards(): PinterestBoard[] {
  return MOCK_BOARD_NAMES.map((name, i) => ({
    id: `mock-board-${i}`,
    name,
    imageUrl: lookPlaceholder(name, [name]),
    pinCount: 12 + i * 7,
  }));
}

export function mockPinterestPins(boardId: string) {
  return Array.from({ length: 6 }).map((_, i) => ({
    id: `${boardId}-pin-${i}`,
    imageUrl: lookPlaceholder(`${boardId}-${i}`),
  }));
}
