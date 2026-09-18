"use client";

import Image from "next/image";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useIngestJobs } from "@/hooks/use-db";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  tagging: "Detecting & tagging clothing (vision AI)",
  segmenting: "Removing background (segmentation)",
  matching: "Finding tiered retail matches",
  done: "Added to closet",
  error: "Failed",
};

export function IngestJobList() {
  const jobs = useIngestJobs();

  if (!jobs || jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No ingestion jobs yet — drop a photo above or import a Pinterest board.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job) => (
        <div key={job.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image src={job.imageUrl} alt={job.sourceLabel} fill unoptimized className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{job.sourceLabel}</p>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {job.sourceType}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {job.status === "error" ? job.error : STATUS_LABEL[job.status]}
            </p>
            {job.status !== "done" && job.status !== "error" && (
              <Progress value={job.progress} className="mt-1.5 h-1.5" />
            )}
          </div>
          <div className="shrink-0">
            {job.status === "done" && <CheckCircle2 className="size-5 text-budget" />}
            {job.status === "error" && <XCircle className="size-5 text-destructive" />}
            {job.status !== "done" && job.status !== "error" && (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
