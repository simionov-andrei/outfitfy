import { NextResponse } from "next/server";
import { findTieredMatches } from "@/lib/ai/retail";
import type { ClothingCategory } from "@/lib/types";

export async function POST(request: Request) {
  const { category, colors, fabric, name } = await request.json();

  if (!category || !name) {
    return NextResponse.json({ error: "category and name are required" }, { status: 400 });
  }

  const matches = await findTieredMatches(
    category as ClothingCategory,
    colors ?? [],
    fabric ?? "",
    name
  );
  return NextResponse.json({ matches });
}
