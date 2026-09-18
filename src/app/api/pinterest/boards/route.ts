import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchPinterestBoards, mockPinterestBoards } from "@/lib/pinterest";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("pinterest_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ boards: mockPinterestBoards(), mocked: true });
  }

  try {
    const boards = await fetchPinterestBoards(accessToken);
    return NextResponse.json({ boards, mocked: false });
  } catch (err) {
    console.error("[pinterest] boards fetch failed:", err);
    return NextResponse.json({ boards: mockPinterestBoards(), mocked: true });
  }
}
