import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export function TierStatTile({
  label,
  value,
  colorVar,
  deltaVsBaseline,
}: {
  label: string;
  value: number;
  colorVar: string;
  deltaVsBaseline?: number; // positive = more expensive than baseline
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: colorVar }}
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(value)}</p>
      {deltaVsBaseline !== undefined && deltaVsBaseline !== 0 && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            deltaVsBaseline > 0 ? "text-destructive" : "text-[#0ca30c]"
          )}
        >
          {deltaVsBaseline > 0 ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )}
          {formatCurrency(Math.abs(deltaVsBaseline))} vs. mid-range
        </p>
      )}
      {deltaVsBaseline === 0 && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Minus className="size-3" />
          baseline
        </p>
      )}
    </div>
  );
}
