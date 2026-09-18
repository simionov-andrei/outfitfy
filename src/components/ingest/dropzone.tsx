"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createIngestJob, fileToDataUrl, processIngestJob } from "@/lib/ingest";
import { toast } from "sonner";

export function IngestDropzone() {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast.error("Please drop image files (JPG, PNG, WEBP).");
      return;
    }

    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      const job = await createIngestJob(dataUrl, "upload", file.name);
      toast.info(`Analyzing ${file.name}…`);
      processIngestJob(job.id);
    }
  }, []);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
        dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UploadCloud className="size-6" />
      </div>
      <div>
        <p className="text-sm font-medium">Drag & drop photos here</p>
        <p className="text-xs text-muted-foreground">Selfies, IG posts, or saved Pinterest pins — JPG, PNG, WEBP</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-primary">
        <ImagePlus className="size-3.5" />
        or click to browse
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
