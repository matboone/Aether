"use client";

import type { AnalysisSummary, FlaggedItem } from "@/src/types/domain";

interface LineItemsTableProps {
  readonly showMore: boolean;
  readonly onShowMore: () => void;
  readonly flaggedItems: FlaggedItem[];
  readonly analysisSummary?: AnalysisSummary;
}

function toCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function LineItemsTable({ showMore, onShowMore, flaggedItems, analysisSummary }: LineItemsTableProps) {
  const visibleItems = flaggedItems.slice(0, showMore ? flaggedItems.length : 4);

  return (
    <>
      <div className="line-items__header">
        <span className="line-items__title">FLAGGED LINE ITEMS</span>
        <span className="line-items__count">
          {analysisSummary?.flaggedCount ?? flaggedItems.length} issues found
        </span>
      </div>

      {visibleItems.map((item) => (
        <div key={`${item.label}-${item.reason}`} className="line-item-row">
          <span className="line-item-row__desc">{item.label}</span>
          <span className="line-item-row__prices">
            <span className="line-item-row__billed line-item-row__billed--struck">
              {toCurrency(item.chargedAmount)}
            </span>
            <span className="line-item-row__fair">{toCurrency(item.suggestedTargetAmount)}</span>
          </span>
          {/* Single style per row — severity was mixing red/amber/green for the same “above benchmark” copy */}
          <span className="flag-chip flag-chip--line-item">
            <span className="flag-dot" />
            {item.reason.replaceAll("_", " ")}
          </span>
        </div>
      ))}

      {flaggedItems.length > 4 && !showMore && (
        <button className="show-more-btn" onClick={onShowMore}>
          Show {flaggedItems.length - 4} more items →
        </button>
      )}
    </>
  );
}
