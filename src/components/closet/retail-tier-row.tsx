import { ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { RetailMatch } from "@/lib/types";
import { TIER_LABELS } from "@/lib/types";

const TIER_ORDER = ["luxury", "premium", "budget"] as const;
const TIER_COLOR_CLASS = {
  luxury: "border-luxury/30 bg-luxury/8 hover:bg-luxury/15",
  premium: "border-premium/30 bg-premium/8 hover:bg-premium/15",
  budget: "border-budget/30 bg-budget/8 hover:bg-budget/15",
};

export function RetailTierRow({
  matches,
  compact = false,
}: {
  matches: RetailMatch[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid grid-cols-3 gap-1.5" : "grid grid-cols-1 gap-2 sm:grid-cols-3"}>
      {TIER_ORDER.map((tier) => {
        const match = matches.find((m) => m.tier === tier);
        if (!match) {
          return (
            <div
              key={tier}
              className="rounded-lg border border-dashed p-2 text-center text-[11px] text-muted-foreground"
            >
              No match
            </div>
          );
        }
        return (
          <a
            key={tier}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className={`group flex flex-col gap-0.5 rounded-lg border p-2 transition-colors ${TIER_COLOR_CLASS[tier]}`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {compact ? tier : TIER_LABELS[tier]}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold tabular-nums">
              {formatCurrency(match.price, match.currency)}
              <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-70" />
            </span>
            <span className="truncate text-[11px] text-muted-foreground">{match.brand}</span>
          </a>
        );
      })}
    </div>
  );
}
