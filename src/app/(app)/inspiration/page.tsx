"use client";

import { useState } from "react";
import Image from "next/image";
import { useInspirationLooks } from "@/hooks/use-db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LookDialog } from "@/components/inspiration/look-dialog";
import type { InspirationLook } from "@/lib/types";

export default function InspirationPage() {
  const looks = useInspirationLooks();
  const [open, setOpen] = useState<InspirationLook | null>(null);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Inspiration Gallery</h1>
        <p className="text-sm text-muted-foreground">
          Curated, pre-analyzed looks. Click one to try it on or clone it straight into your closet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(looks ?? []).map((look) => (
          <Card
            key={look.id}
            className="group cursor-pointer overflow-hidden py-0 gap-0"
            onClick={() => setOpen(look)}
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-muted">
              <Image
                src={look.imageUrl}
                alt={look.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <Badge variant="secondary" className="absolute left-2 top-2 backdrop-blur">
                {look.aesthetic}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 p-3">
              <p className="truncate text-sm font-medium">{look.title}</p>
              <p className="text-xs text-muted-foreground">{look.items.length} pieces</p>
            </div>
          </Card>
        ))}
      </div>

      <LookDialog look={open} open={!!open} onOpenChange={(o) => !o && setOpen(null)} />
    </div>
  );
}
