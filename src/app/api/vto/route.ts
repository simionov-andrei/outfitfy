import { NextResponse } from "next/server";
import { generateVirtualTryOn } from "@/lib/ai/vto";

export async function POST(request: Request) {
  const { modelImageDataUrl, garmentImageDataUrls } = await request.json();

  if (!modelImageDataUrl || !Array.isArray(garmentImageDataUrls) || garmentImageDataUrls.length === 0) {
    return NextResponse.json(
      { error: "modelImageDataUrl and at least one garmentImageDataUrl are required" },
      { status: 400 }
    );
  }

  const result = await generateVirtualTryOn({ modelImageDataUrl, garmentImageDataUrls });
  return NextResponse.json(result);
}
