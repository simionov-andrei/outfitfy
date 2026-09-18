import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchPinterestPins, mockPinterestPins } from "@/lib/pinterest";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("pinterest_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ pins: mockPinterestPins(boardId), mocked: true });
  }

  try {
    const pins = await fetchPinterestPins(accessToken, boardId);
    return NextResponse.json({ pins, mocked: false });
  } catch (err) {
    console.error("[pinterest] pins fetch failed:", err);
    return NextResponse.json({ pins: mockPinterestPins(boardId), mocked: true });
  }
}
