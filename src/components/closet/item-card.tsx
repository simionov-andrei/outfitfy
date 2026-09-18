"use client";

import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RetailTierRow } from "./retail-tier-row";
import { db } from "@/lib/db";
import type { ClosetItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ClosetItemCard({
  item,
  onOpen,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  item: ClosetItem;
  onOpen?: (item: ClosetItem) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (item: ClosetItem) => void;
}) {
  return (
    <Card className="group overflow-hidden py-0 gap-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => (selectable ? onToggleSelect?.(item) : onOpen?.(item))}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (selectable) {
              onToggleSelect?.(item);
            } else {
              onOpen?.(item);
            }
          }
        }}
        className={cn(
          "relative block aspect-[4/5] w-full cursor-pointer overflow-hidden bg-muted",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Badge variant="secondary" className="absolute left-2 top-2 backdrop-blur">
          {item.category}
        </Badge>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            db.closetItems.update(item.id, { favorite: !item.favorite });
          }}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
        >
          <Heart className={cn("size-3.5", item.favorite && "fill-destructive text-destructive")} />
        </button>
        {item.wearCount > 0 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
            Worn {item.wearCount}×
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div>
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.fabric} · {item.colors.join(", ")}
          </p>
        </div>
        <RetailTierRow matches={item.retailMatches} compact />
        {onOpen && (
          <Button
            variant="outline"
            size="sm"
            className="mt-1 w-full"
            onClick={() => onOpen(item)}
          >
            <ShoppingBag className="size-3.5" />
            View details
          </Button>
        )}
      </div>
    </Card>
  );
}
