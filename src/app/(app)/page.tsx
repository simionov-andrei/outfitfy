"use client";

import Link from "next/link";
import { ArrowRight, Shirt, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { useClosetItems, useInspirationLooks } from "@/hooks/use-db";
import { computeCategoryBreakdown, computeTierTotals } from "@/lib/pricing";
import { computeUnderutilized } from "@/lib/planner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TierCostChart } from "@/components/charts/tier-cost-chart";
import { TierStatTile } from "@/components/charts/tier-stat-tile";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const items = useClosetItems();
  const looks = useInspirationLooks();

  const totals = computeTierTotals(items ?? []);
  const breakdown = computeCategoryBreakdown(items ?? []);
  const underused = computeUnderutilized(items ?? [], 5);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Your local-first wardrobe studio — everything below lives only in this browser.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col justify-between gap-3 pt-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shirt className="size-4" />
              <span className="text-sm">Wardrobe size</span>
            </div>
            <p className="text-3xl font-semibold tabular-nums">{items?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">pieces cataloged</p>
          </CardContent>
        </Card>
        <TierStatTile label="High-End total" value={totals.luxury} colorVar="var(--luxury)" deltaVsBaseline={totals.luxury - totals.premium} />
        <TierStatTile label="Mid-Range total" value={totals.premium} colorVar="var(--premium)" deltaVsBaseline={0} />
        <TierStatTile label="Budget total" value={totals.budget} colorVar="var(--budget)" deltaVsBaseline={totals.budget - totals.premium} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4" />
                What your wardrobe costs, by tier
              </CardTitle>
              <CardDescription>
                Cumulative cost if every current item were bought High-End vs. Mid-Range vs. Budget, by category.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TierCostChart data={breakdown} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              Underutilized pieces
            </CardTitle>
            <CardDescription>The planner prioritizes these first — no forgotten pieces.</CardDescription>
          </CardHeader>
          <CardContent>
            {underused.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add items to your closet to see suggestions.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {underused.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1">
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                    </div>
                    <p className="truncate text-xs font-medium">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">Worn {item.wearCount}×</p>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
              <Link href="/planner">
                Plan this week <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="size-4" />
              Curated inspiration
            </CardTitle>
            <CardDescription>Clone a look straight into your closet, or try it on virtually.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(looks ?? []).slice(0, 3).map((look) => (
              <div key={look.id} className="flex flex-col gap-1">
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={look.imageUrl} alt={look.title} className="size-full object-cover" />
                </div>
                <p className="truncate text-xs font-medium">{look.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {look.items.length} pieces · avg {formatCurrency(
                    look.items.reduce((s, i) => s + (i.retailMatches.find((m) => m.tier === "premium")?.price ?? 0), 0) /
                      Math.max(1, look.items.length)
                  )}
                </p>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="col-span-full mt-1 w-full" asChild>
              <Link href="/inspiration">
                Browse gallery <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
