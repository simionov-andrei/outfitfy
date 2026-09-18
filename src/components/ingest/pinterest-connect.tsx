"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Link2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createIngestJob, processIngestJob } from "@/lib/ingest";
import type { PinterestBoard } from "@/lib/types";
import { toast } from "sonner";

interface Pin {
  id: string;
  imageUrl: string;
}

export function PinterestConnect() {
  const searchParams = useSearchParams();
  const status = searchParams.get("pinterest");
  const [boards, setBoards] = useState<PinterestBoard[] | null>(null);
  const [mocked, setMocked] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [importing, setImporting] = useState(false);

  const connected = status === "connected" || status === "mock";

  useEffect(() => {
    if (!connected) return;
    fetch("/api/pinterest/boards")
      .then((r) => r.json())
      .then((data) => {
        setBoards(data.boards);
        setMocked(data.mocked);
      })
      .finally(() => setLoadingBoards(false));
  }, [connected]);

  async function selectBoard(board: PinterestBoard) {
    setActiveBoard(board.id);
    setPins([]);
    const res = await fetch(`/api/pinterest/boards/${board.id}/pins`);
    const data = await res.json();
    setPins(data.pins);
  }

  async function importBoard() {
    if (!activeBoard || pins.length === 0) return;
    setImporting(true);
    const board = boards?.find((b) => b.id === activeBoard);
    for (const pin of pins) {
      const job = await createIngestJob(pin.imageUrl, "pinterest", board?.name ?? "Pinterest pin");
      processIngestJob(job.id);
    }
    toast.success(`Queued ${pins.length} pins from "${board?.name}" for analysis`);
    setImporting(false);
    setActiveBoard(null);
    setPins([]);
  }

  if (!connected) {
    return (
      <Card className="flex flex-col items-start gap-3 p-5">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-[#e60023]/10 text-[#e60023]">
            <Link2 className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Connect Pinterest</p>
            <p className="text-xs text-muted-foreground">Import boards and auto-ingest every pin</p>
          </div>
        </div>
        <Button asChild size="sm">
          <a href="/api/pinterest/auth">Connect account</a>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            Pinterest connected
            {mocked && (
              <Badge variant="outline" className="text-[10px]">
                demo boards
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {mocked
              ? "No PINTEREST_CLIENT_ID configured — showing sample boards."
              : "Select a board to import its pins."}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setLoadingBoards(true);
            fetch("/api/pinterest/boards")
              .then((r) => r.json())
              .then((data) => setBoards(data.boards))
              .finally(() => setLoadingBoards(false));
          }}
        >
          <RefreshCcw className={loadingBoards ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(boards ?? []).map((board) => (
          <button
            key={board.id}
            onClick={() => selectBoard(board)}
            className={`flex flex-col gap-1 rounded-lg border p-2 text-left transition-colors hover:border-primary ${
              activeBoard === board.id ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
              {board.imageUrl && (
                <Image src={board.imageUrl} alt={board.name} fill unoptimized className="object-cover" />
              )}
            </div>
            <p className="truncate text-xs font-medium">{board.name}</p>
            <p className="text-[11px] text-muted-foreground">{board.pinCount} pins</p>
          </button>
        ))}
      </div>

      {activeBoard && (
        <div className="flex flex-col gap-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">{pins.length} pins found</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pins.map((pin) => (
              <div key={pin.id} className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image src={pin.imageUrl} alt="pin" fill unoptimized className="object-cover" />
              </div>
            ))}
          </div>
          <Button size="sm" onClick={importBoard} disabled={importing} className="w-fit">
            {importing ? "Queuing…" : `Import ${pins.length} pins`}
          </Button>
        </div>
      )}
    </Card>
  );
}
