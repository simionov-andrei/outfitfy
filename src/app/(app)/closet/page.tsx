"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Shirt as ShirtIcon } from "lucide-react";
import { useClosetItems } from "@/hooks/use-db";
import { seedDemoClosetItems } from "@/lib/seed";
import { CATEGORIES, TIER_LABELS, type PriceTier } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClosetItemCard } from "@/components/closet/item-card";
import { ItemDetailDialog } from "@/components/closet/item-detail-dialog";
import type { ClosetItem } from "@/lib/types";
import Link from "next/link";

export default function ClosetPage() {
  const items = useClosetItems();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [tier, setTier] = useState<PriceTier | "all">("all");
  const [sort, setSort] = useState<"newest" | "underused" | "price-desc">("newest");
  const [openItem, setOpenItem] = useState<ClosetItem | null>(null);
  const [seeding, setSeeding] = useState(false);

  const filtered = useMemo(() => {
    if (!items) return [];
    let result = items.filter((item) => {
      if (search && !`${item.name} ${item.colors.join(" ")}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (category !== "all" && item.category !== category) return false;
      if (tier !== "all" && !item.retailMatches.some((m) => m.tier === tier)) return false;
      return true;
    });

    if (sort === "underused") {
      result = [...result].sort((a, b) => a.wearCount - b.wearCount);
    } else if (sort === "price-desc") {
      result = [...result].sort((a, b) => b.estimatedValue - a.estimatedValue);
    } else {
      result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return result;
  }, [items, search, category, tier, sort]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Digital Closet</h1>
        <p className="text-sm text-muted-foreground">
          {items ? `${items.length} item${items.length === 1 ? "" : "s"}` : "Loading…"} in your local wardrobe
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or color…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tier} onValueChange={(v) => setTier(v as PriceTier | "all")}>
            <SelectTrigger size="sm" className="w-[150px]">
              <SelectValue placeholder="Price tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              {(Object.keys(TIER_LABELS) as PriceTier[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TIER_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="underused">Underused first</SelectItem>
              <SelectItem value="price-desc">Highest value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {items && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card py-16 text-center">
          <ShirtIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">Your closet is empty</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Upload a photo, connect Pinterest, or clone a look from the Inspiration Gallery to get started.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/ingest">Ingest photos</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={seeding}
              onClick={async () => {
                setSeeding(true);
                await seedDemoClosetItems();
                setSeeding(false);
              }}
            >
              {seeding ? "Loading…" : "Load sample wardrobe"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <ClosetItemCard key={item.id} item={item} onOpen={setOpenItem} />
          ))}
        </div>
      )}

      {items && items.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No items match your filters.
        </p>
      )}

      <ItemDetailDialog item={openItem} open={!!openItem} onOpenChange={(o) => !o && setOpenItem(null)} />
    </div>
  );
}
