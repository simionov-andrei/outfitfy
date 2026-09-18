import { Suspense } from "react";
import { IngestDropzone } from "@/components/ingest/dropzone";
import { PinterestConnect } from "@/components/ingest/pinterest-connect";
import { IngestJobList } from "@/components/ingest/job-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function IngestPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Ingest</h1>
        <p className="text-sm text-muted-foreground">
          Every photo runs through detection & tagging, background segmentation, AI product-photo
          generation, and tiered retail matching — then lands directly in your local closet.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <IngestDropzone />
        <Suspense fallback={<div className="h-full rounded-xl border bg-card" />}>
          <PinterestConnect />
        </Suspense>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing queue</CardTitle>
          <CardDescription>Detection → Segmentation → AI Photo → Retail matching → Closet</CardDescription>
        </CardHeader>
        <CardContent>
          <IngestJobList />
        </CardContent>
      </Card>
    </div>
  );
}
