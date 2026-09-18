import { NextResponse } from "next/server";
import { segmentGarment } from "@/lib/ai/segmentation";
import type { ClothingCategory } from "@/lib/types";

export async function POST(request: Request) {
  const { imageDataUrl, box, category, colors, seed } = await request.json();

  if (!imageDataUrl || !box || !category) {
    return NextResponse.json({ error: "imageDataUrl, box, and category are required" }, { status: 400 });
  }

  const result = await segmentGarment(
    imageDataUrl,
    box,
    category as ClothingCategory,
    colors ?? [],
    seed ?? category
  );
  return NextResponse.json(result);
}
