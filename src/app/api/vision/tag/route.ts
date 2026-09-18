import { NextResponse } from "next/server";
import { detectAndTagClothing } from "@/lib/ai/tagging";

export async function POST(request: Request) {
  const { imageDataUrl } = await request.json();

  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return NextResponse.json({ error: "imageDataUrl is required" }, { status: 400 });
  }

  const result = await detectAndTagClothing(imageDataUrl);
  return NextResponse.json(result);
}
