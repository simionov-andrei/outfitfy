"use client";

import { useMemo, useState } from "react";
import { Wand2, Save, X } from "lucide-react";
import { useClosetItems, useModelPhotos } from "@/hooks/use-db";
import { useTryOnStore } from "@/lib/store/try-on-store";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModelPicker } from "@/components/try-on/model-picker";
import { GarmentPicker } from "@/components/try-on/garment-picker";
import { TryOnCanvas } from "@/components/try-on/canvas";
import { toast } from "sonner";

export default function TryOnPage() {
  const items = useClosetItems();
  const modelPhotos = useModelPhotos();
  const modelPhotoId = useTryOnStore((s) => s.modelPhotoId);
  const selectedItemIds = useTryOnStore((s) => s.selectedItemIds);
  const resultImageUrl = useTryOnStore((s) => s.resultImageUrl);
  const generating = useTryOnStore((s) => s.generating);
  const setResult = useTryOnStore((s) => s.setResult);
  const setGenerating = useTryOnStore((s) => s.setGenerating);
  const toggleItem = useTryOnStore((s) => s.toggleItem);
  const clearSelection = useTryOnStore((s) => s.clearSelection);
  const [outfitName, setOutfitName] = useState("");

  const modelPhoto = modelPhotos?.find((p) => p.id === modelPhotoId) ?? null;
  const selectedItems = useMemo(
    () => (items ?? []).filter((i) => selectedItemIds.includes(i.id)),
    [items, selectedItemIds]
  );

  async function generate() {
    if (!modelPhoto || selectedItems.length === 0) {
      toast.error("Pick a model photo and at least one item.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/vto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelImageDataUrl: modelPhoto.imageUrl,
          garmentImageDataUrls: selectedItems.map((i) => i.imageUrl),
        }),
      });
      const data = await res.json();
      setResult(data.imageUrl);
      if (data.mocked) {
        toast.info("Using mock VTO output — set REPLICATE_API_TOKEN + REPLICATE_VTON_MODEL_VERSION for live generation.");
      } else {
        toast.success("Try-on generated");
      }
      for (const item of selectedItems) {
        await db.closetItems.update(item.id, {
          wearCount: item.wearCount + 1,
          lastWornAt: new Date().toISOString(),
        });
      }
    } catch {
      toast.error("Try-on generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveOutfit() {
    if (selectedItems.length === 0) return;
    await db.outfits.add({
      id: crypto.randomUUID(),
      name: outfitName || `Outfit — ${new Date().toLocaleDateString()}`,
      itemIds: selectedItems.map((i) => i.id),
      imageUrl: resultImageUrl ?? undefined,
      createdAt: new Date().toISOString(),
      generatedBy: resultImageUrl ? "ai" : "manual",
    });
    toast.success("Outfit saved");
    setOutfitName("");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Virtual Try-On Studio</h1>
        <p className="text-sm text-muted-foreground">
          Layer pieces from your closet onto a model photo, then generate a realistic AI composite.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <TryOnCanvas
            modelImageUrl={modelPhoto?.imageUrl ?? null}
            items={selectedItems}
            resultImageUrl={resultImageUrl}
            generating={generating}
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={generate} disabled={generating}>
              <Wand2 className="size-4" />
              {generating ? "Generating…" : "Generate AI try-on"}
            </Button>
            {resultImageUrl && (
              <Button variant="outline" onClick={() => setResult(null)}>
                <X className="size-4" />
                Clear result
              </Button>
            )}
            <Button variant="secondary" onClick={saveOutfit} disabled={selectedItems.length === 0}>
              <Save className="size-4" />
              Save outfit
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Model photo</CardTitle>
              <CardDescription>Upload a full-body photo of yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <ModelPicker />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Select pieces</CardTitle>
                <CardDescription>{selectedItems.length} selected</CardDescription>
              </div>
              {selectedItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <GarmentPicker />
            </CardContent>
          </Card>

          {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedItems.map((item) => (
                <Badge key={item.id} variant="secondary" className="cursor-pointer" onClick={() => toggleItem(item.id)}>
                  {item.name} <X className="size-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
