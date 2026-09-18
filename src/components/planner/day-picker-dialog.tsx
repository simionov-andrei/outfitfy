"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClosetItems } from "@/hooks/use-db";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export function DayPickerDialog({
  date,
  open,
  onOpenChange,
  initialItemIds,
}: {
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItemIds: string[];
}) {
  const items = useClosetItems();
  const [selected, setSelected] = useState<string[]>(initialItemIds);

  async function save() {
    await db.plannerEntries.put({
      id: date,
      date,
      itemIds: selected,
      generatedBy: "manual",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{format(new Date(date), "EEEE, MMMM d")}</DialogTitle>
          <DialogDescription>Pick the pieces you&apos;re wearing this day.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="grid grid-cols-4 gap-2 pr-3">
            {(items ?? []).map((item) => {
              const active = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setSelected((prev) =>
                      prev.includes(item.id) ? prev.filter((i) => i !== item.id) : [...prev, item.id]
                    )
                  }
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-lg border-2 bg-muted",
                    active ? "border-primary" : "border-transparent"
                  )}
                >
                  <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
                  {active && <div className="absolute inset-0 bg-primary/20" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSelected([])}>
            Clear day
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
