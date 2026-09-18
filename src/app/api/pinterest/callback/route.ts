import { NextResponse } from "next/server";
import { exchangePinterestCode } from "@/lib/pinterest";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("pinterest_oauth_state="))
    ?.split("=")[1];

  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(new URL("/ingest?pinterest=error", url.origin));
  }

  try {
    const redirectUri = `${url.origin}/api/pinterest/callback`;
    const tokens = await exchangePinterestCode(code, redirectUri);

    const response = NextResponse.redirect(new URL("/ingest?pinterest=connected", url.origin));
    response.cookies.set("pinterest_access_token", tokens.access_token, {
      httpOnly: true,
      maxAge: tokens.expires_in ?? 3600,
      path: "/",
    });
    response.cookies.delete("pinterest_oauth_state");
    return response;
  } catch (err) {
    console.error("[pinterest] callback failed:", err);
    return NextResponse.redirect(new URL("/ingest?pinterest=error", url.origin));
  }
}
