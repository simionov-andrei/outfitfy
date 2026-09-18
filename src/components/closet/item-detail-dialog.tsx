"use client";

import Image from "next/image";
import { Trash2, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RetailTierRow } from "./retail-tier-row";
import { db } from "@/lib/db";
import type { ClosetItem } from "@/lib/types";
import { toast } from "sonner";

export function ItemDetailDialog({
  item,
  open,
  onOpenChange,
}: {
  item: ClosetItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            {item.category} · {item.fabric} · {item.pattern}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
            <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {item.colors.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
              {item.seasons.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Worn {item.wearCount} time{item.wearCount === 1 ? "" : "s"}
              {item.sourceType !== "manual" && ` · sourced from ${item.sourceType}`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  db.closetItems.update(item.id, { favorite: !item.favorite });
                }}
              >
                <Heart className={item.favorite ? "size-3.5 fill-destructive text-destructive" : "size-3.5"} />
                {item.favorite ? "Favorited" : "Favorite"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await db.closetItems.delete(item.id);
                  toast.success("Removed from closet");
                  onOpenChange(false);
                }}
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Shop this piece — three tiers</p>
          <RetailTierRow matches={item.retailMatches} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
