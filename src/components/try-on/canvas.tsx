"use client";

import Image from "next/image";
import { Wand2, User } from "lucide-react";
import type { ClosetItem, ClothingCategory } from "@/lib/types";
import { modelPlaceholder } from "@/lib/placeholder";
import { cn } from "@/lib/utils";

const REGION: Record<ClothingCategory, { top: string; left: string; width: string; z: number }> = {
  Outerwear: { top: "18%", left: "50%", width: "48%", z: 4 },
  Tops: { top: "20%", left: "50%", width: "40%", z: 3 },
  Knitwear: { top: "20%", left: "50%", width: "42%", z: 3 },
  Dresses: { top: "20%", left: "50%", width: "42%", z: 3 },
  Activewear: { top: "20%", left: "50%", width: "40%", z: 3 },
  Bottoms: { top: "52%", left: "50%", width: "36%", z: 2 },
  Denim: { top: "52%", left: "50%", width: "36%", z: 2 },
  Footwear: { top: "88%", left: "50%", width: "26%", z: 5 },
  Bags: { top: "58%", left: "78%", width: "22%", z: 6 },
  Accessories: { top: "10%", left: "50%", width: "16%", z: 7 },
  Jewelry: { top: "13%", left: "50%", width: "12%", z: 7 },
};

export function TryOnCanvas({
  modelImageUrl,
  items,
  resultImageUrl,
  generating,
}: {
  modelImageUrl: string | null;
  items: ClosetItem[];
  resultImageUrl: string | null;
  generating: boolean;
}) {
  const displayImage = resultImageUrl ?? modelImageUrl;

  return (
    <div className="relative mx-auto aspect-[3/5] w-full max-w-sm overflow-hidden rounded-xl border bg-muted">
      {displayImage ? (
        <Image src={displayImage} alt="Model" fill unoptimized className="object-cover" />
      ) : (
        <Image src={modelPlaceholder("empty")} alt="No model" fill unoptimized className="object-cover opacity-60" />
      )}

      {!resultImageUrl &&
        items.map((item) => {
          const region = REGION[item.category];
          return (
            <div
              key={item.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
              style={{ top: region.top, left: region.left, width: region.width, zIndex: region.z }}
            >
              <div className="relative aspect-square">
                <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-contain" />
              </div>
            </div>
          );
        })}

      {!modelImageUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center text-sm text-muted-foreground">
          <User className="size-6" />
          Upload or select a model photo
        </div>
      )}

      {generating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-sm font-medium">
          <Wand2 className="size-6 animate-pulse text-primary" />
          Generating try-on…
        </div>
      )}

      {resultImageUrl && (
        <div className={cn("absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-1 text-[10px] font-medium")}>
          AI generated preview
        </div>
      )}
    </div>
  );
}
