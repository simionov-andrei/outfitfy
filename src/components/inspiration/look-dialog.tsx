"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RetailTierRow } from "@/components/closet/retail-tier-row";
import { cloneInspirationLookToCloset } from "@/lib/seed";
import type { InspirationLook } from "@/lib/types";
import { toast } from "sonner";

export function LookDialog({
  look,
  open,
  onOpenChange,
}: {
  look: InspirationLook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [cloning, setCloning] = useState(false);

  if (!look) return null;

  async function handleClone() {
    setCloning(true);
    try {
      const items = await cloneInspirationLookToCloset(look!.id);
      toast.success(`Added ${items.length} pieces to your closet`);
      onOpenChange(false);
    } finally {
      setCloning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{look.title}</DialogTitle>
          <DialogDescription>{look.aesthetic} aesthetic</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
            <Image src={look.imageUrl} alt={look.title} fill unoptimized className="object-cover" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {look.tags.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleClone} disabled={cloning}>
                <Copy className="size-3.5" />
                {cloning ? "Cloning…" : "Clone into closet"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await cloneInspirationLookToCloset(look.id);
                  router.push("/try-on");
                }}
              >
                <Wand2 className="size-3.5" />
                Try on virtually
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{look.items.length} pieces in this look</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {look.items.map((item) => (
              <div key={item.name} className="flex gap-3 rounded-lg border p-2">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  <RetailTierRow matches={item.retailMatches} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
