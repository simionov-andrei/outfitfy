"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { addWeeks, format, startOfWeek, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Sparkles, Trash2 } from "lucide-react";
import { useClosetItems, usePlannerEntries } from "@/hooks/use-db";
import { generateWeeklyPlan, toPlannerEntries } from "@/lib/planner";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DayPickerDialog } from "@/components/planner/day-picker-dialog";
import { toast } from "sonner";

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const items = useClosetItems();

  const weekStart = useMemo(
    () => addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset),
    [weekOffset]
  );
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekStartIso = format(weekStart, "yyyy-MM-dd");
  const weekEndIso = format(addDays(weekStart, 6), "yyyy-MM-dd");
  const entries = usePlannerEntries(weekStartIso, weekEndIso);

  const entryByDate = new Map((entries ?? []).map((e) => [e.date, e]));
  const itemById = new Map((items ?? []).map((i) => [i.id, i]));

  async function autoGenerate() {
    if (!items || items.length < 3) {
      toast.error("Add a few more closet items before auto-generating a week.");
      return;
    }
    setGenerating(true);
    try {
      const plan = generateWeeklyPlan(items, weekStart);
      const plannerEntries = toPlannerEntries(plan);
      await db.plannerEntries.bulkPut(plannerEntries);
      toast.success("Generated a full week — prioritizing your underused pieces.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Weekly Outfit Planner</h1>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            This week
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button onClick={autoGenerate} disabled={generating}>
            <Sparkles className="size-4" />
            {generating ? "Generating…" : "AI Auto-Generate Week"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((date) => {
          const iso = format(date, "yyyy-MM-dd");
          const entry = entryByDate.get(iso);
          const dayItems = (entry?.itemIds ?? []).map((id) => itemById.get(id)).filter(Boolean);
          const isToday = format(new Date(), "yyyy-MM-dd") === iso;

          return (
            <Card key={iso} className={`flex flex-col gap-2 p-3 ${isToday ? "border-primary" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">{format(date, "EEE")}</p>
                  <p className="text-sm font-semibold">{format(date, "MMM d")}</p>
                </div>
                {entry?.generatedBy === "ai" && (
                  <Sparkles className="size-3.5 text-primary" />
                )}
              </div>

              <div className="grid min-h-[88px] grid-cols-2 gap-1.5">
                {dayItems.length === 0 ? (
                  <button
                    onClick={() => setEditingDate(iso)}
                    className="col-span-2 flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-6 text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <Plus className="size-4" />
                    <span className="text-[10px]">Add outfit</span>
                  </button>
                ) : (
                  dayItems.map((item) => (
                    <div key={item!.id} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                      <Image src={item!.imageUrl} alt={item!.name} fill unoptimized className="object-cover" />
                    </div>
                  ))
                )}
              </div>

              {entry?.note && <p className="truncate text-[11px] text-muted-foreground">{entry.note}</p>}

              {dayItems.length > 0 && (
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => setEditingDate(iso)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => db.plannerEntries.delete(iso)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {editingDate && (
        <DayPickerDialog
          key={editingDate}
          date={editingDate}
          open={!!editingDate}
          onOpenChange={(o) => !o && setEditingDate(null)}
          initialItemIds={entryByDate.get(editingDate)?.itemIds ?? []}
        />
      )}
    </div>
  );
}
