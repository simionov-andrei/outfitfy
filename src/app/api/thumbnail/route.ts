import { NextResponse } from "next/server";
import { generateProductThumbnail } from "@/lib/ai/thumbnail";

export async function POST(request: Request) {
  const { imageDataUrl, description, fabric } = await request.json();

  if (!imageDataUrl || !description) {
    return NextResponse.json({ error: "imageDataUrl and description are required" }, { status: 400 });
  }

  const result = await generateProductThumbnail(imageDataUrl, description, fabric);
  return NextResponse.json(result);
}
