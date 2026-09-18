"use client";

import Image from "next/image";
import { useClosetItems } from "@/hooks/use-db";
import { useTryOnStore } from "@/lib/store/try-on-store";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GarmentPicker() {
  const items = useClosetItems();
  const selectedItemIds = useTryOnStore((s) => s.selectedItemIds);
  const toggleItem = useTryOnStore((s) => s.toggleItem);

  if (items && items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Your closet is empty — add items in Ingest or Inspiration first.
      </p>
    );
  }

  return (
    <ScrollArea className="h-80">
      <div className="grid grid-cols-3 gap-2 pr-3">
        {(items ?? []).map((item) => {
          const selected = selectedItemIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 bg-muted",
                selected ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
              {selected && (
                <div className="absolute inset-0 bg-primary/20" />
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
