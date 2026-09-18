"use client";

import { useRef } from "react";
import Image from "next/image";
import { UserPlus } from "lucide-react";
import { useModelPhotos } from "@/hooks/use-db";
import { db } from "@/lib/db";
import { fileToDataUrl } from "@/lib/ingest";
import { useTryOnStore } from "@/lib/store/try-on-store";
import { cn } from "@/lib/utils";

export function ModelPicker() {
  const photos = useModelPhotos();
  const modelPhotoId = useTryOnStore((s) => s.modelPhotoId);
  const setModelPhoto = useTryOnStore((s) => s.setModelPhoto);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    const dataUrl = await fileToDataUrl(file);
    const id = crypto.randomUUID();
    await db.modelPhotos.add({
      id,
      imageUrl: dataUrl,
      label: file.name,
      createdAt: new Date().toISOString(),
    });
    setModelPhoto(id);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => inputRef.current?.click()}
        className="flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary"
      >
        <UserPlus className="size-4" />
        <span className="text-[10px]">Add</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      {(photos ?? []).map((photo) => (
        <button
          key={photo.id}
          onClick={() => setModelPhoto(photo.id)}
          className={cn(
            "relative size-16 shrink-0 overflow-hidden rounded-lg border-2",
            modelPhotoId === photo.id ? "border-primary" : "border-transparent"
          )}
        >
          <Image src={photo.imageUrl} alt={photo.label} fill unoptimized className="object-cover" />
        </button>
      ))}
    </div>
  );
}
