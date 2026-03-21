"use client";

import { LINE_ITEMS } from "@/app/_constants/dashboard";

interface LineItemsTableProps {
  readonly showMore: boolean;
  readonly onShowMore: () => void;
}

export function LineItemsTable({ showMore, onShowMore }: LineItemsTableProps) {
  return (
    <>
      <div className="line-items__header">
        <span className="line-items__title">FLAGGED LINE ITEMS</span>
        <span className="line-items__count">3 issues found</span>
      </div>
      {LINE_ITEMS.slice(0, showMore ? 7 : 4).map((item) => (
        <div key={item.desc} className="line-item-row">
          <span className="line-item-row__desc">{item.desc}</span>
          <span className="line-item-row__billed">{item.billed}</span>
          <span className="line-item-row__fair">{item.fair}</span>
          <span className={`flag-chip flag-chip--${item.flagType}`}>
            <span className="flag-dot" />
            {item.flag}
          </span>
        </div>
      ))}
      {!showMore && (
        <button className="show-more-btn" onClick={onShowMore}>
          Show 3 more items &rarr;
        </button>
      )}
    </>
  );
}
