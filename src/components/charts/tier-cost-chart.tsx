"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { TierTotals } from "@/lib/pricing";

const TIER_META = [
  { key: "luxury" as const, label: "High-End / Luxury", color: "var(--luxury)" },
  { key: "premium" as const, label: "Mid-Range / Premium", color: "var(--premium)" },
  { key: "budget" as const, label: "Budget / Fast-Fashion", color: "var(--budget)" },
];

interface CategoryRow extends TierTotals {
  category: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => {
          const meta = TIER_META.find((t) => t.key === p.dataKey);
          return (
            <div key={p.dataKey} className="flex items-center gap-2">
              <span
                className="inline-block h-0.5 w-3 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="font-semibold text-popover-foreground tabular-nums">
                {formatCurrency(p.value)}
              </span>
              <span className="text-muted-foreground">{meta?.label ?? p.dataKey}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TierCostChart({ data }: { data: CategoryRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Add items to your closet to see the cost breakdown.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barCategoryGap={20} barGap={2} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="category"
          tickLine={false}
          axisLine={{ stroke: "var(--chart-baseline)" }}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`}
          width={44}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <Legend
          verticalAlign="top"
          height={32}
          iconType="plainline"
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground">
              {TIER_META.find((t) => t.label === value)?.label ?? value}
            </span>
          )}
        />
        {TIER_META.map((tier) => (
          <Bar
            key={tier.key}
            dataKey={tier.key}
            name={tier.label}
            fill={tier.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
