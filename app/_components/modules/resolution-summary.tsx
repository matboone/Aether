"use client";

import { BadgeCheck } from "lucide-react";
import type { RenderableSessionUi } from "@/src/types/domain";

interface ResolutionSummaryProps {
  readonly summary: RenderableSessionUi["resolutionSummary"];
}

function toCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function ResolutionSummary({ summary }: ResolutionSummaryProps) {
  if (!summary) return null;

  const original = summary.originalAmount ?? null;
  const reduced = summary.reducedAmount ?? null;
  const savings = summary.savingsAmount ?? null;

  return (
    <div className="resolution-summary">
      <div className="resolution-stats">
        <div className="resolution-stat">
          <div className="resolution-stat__label">ORIGINAL</div>
          <div className="resolution-stat__value">{toCurrency(original)}</div>
        </div>
        <div className="resolution-stat">
          <div className="resolution-stat__label">DISPUTED</div>
          <div className="resolution-stat__value resolution-stat__value--teal">
            {toCurrency(savings)}
          </div>
        </div>
        <div className="resolution-stat">
          <div className="resolution-stat__label">REMAINING</div>
          <div className="resolution-stat__value">{toCurrency(reduced)}</div>
        </div>
      </div>
      <div className="resolution-callout">
        <div className="resolution-callout__label">MONEY SAVED</div>
        <div className="resolution-callout__value">{toCurrency(savings)}</div>
        <div className="resolution-callout__note">
          {summary.notes ?? `Resolved as ${summary.resolutionType.replaceAll("_", " ")}`}
        </div>
        <div className="resolution-callout__accuracy">
          <BadgeCheck size={12} /> Guaranteed Accuracy
        </div>
      </div>
      <div style={{ clear: "both" }} />
    </div>
  );
}
