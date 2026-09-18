import { NextResponse } from "next/server";
import { isPinterestConfigured, buildPinterestAuthUrl } from "@/lib/pinterest";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!isPinterestConfigured()) {
    return NextResponse.redirect(new URL("/ingest?pinterest=mock", url.origin));
  }

  const redirectUri = `${url.origin}/api/pinterest/callback`;
  const state = crypto.randomUUID();
  const authUrl = buildPinterestAuthUrl(redirectUri, state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("pinterest_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });
  return response;
}
