"use client";

import { Check } from "lucide-react";
import type { AnalysisSummary } from "@/src/types/domain";

interface BillSummaryProps {
  readonly analysisReady: boolean;
  readonly hospitalName?: string | null;
  readonly totalAmount?: number | null;
  readonly analysisSummary?: AnalysisSummary;
}

function toCurrency(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function BillSummary({ analysisReady, hospitalName, totalAmount, analysisSummary }: BillSummaryProps) {
  const monogram = (hospitalName ?? "Hospital")
    .split(" ")
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const originalTotal = analysisSummary?.originalTotal ?? totalAmount ?? null;
  const estimatedOvercharge = analysisSummary?.estimatedOvercharge ?? null;

  return (
    <div className="bill-summary">
      <div className="bill-summary__left">
        <div className="bill-summary__label">BILL SUMMARY</div>
        <div className="bill-summary__hospital-row">
          <div className="monogram">{monogram}</div>
          <div>
            <div className="bill-summary__hospital-name">
              {hospitalName ?? "Hospital"}
            </div>
          </div>
        </div>
        <div className="bill-summary__meta">
          {analysisSummary
            ? `${analysisSummary.flaggedCount} flagged charges identified`
            : "Waiting for bill analysis"}
        </div>
        <div className="bill-summary__total">{toCurrency(originalTotal)}</div>
      </div>
      <div className="bill-summary__right">
        {analysisReady ? (
          <div className="status-badge status-badge--complete">
            <Check size={12} /> Analysis ready
          </div>
        ) : (
          <div className="status-badge status-badge--analyzing">
            <span className="pulse-dot" />{" "}
            Analyzing…
          </div>
        )}

        <div className="bill-summary__facts">
          <div className="bill-summary__fact">
            <div className="bill-summary__fact-label">Statement total</div>
            <div className="bill-summary__fact-value">{toCurrency(originalTotal)}</div>
          </div>
          <div className="bill-summary__fact">
            <div className="bill-summary__fact-label">Flagged charges</div>
            <div className="bill-summary__fact-value">
              {analysisReady && analysisSummary ? analysisSummary.flaggedCount : "—"}
            </div>
          </div>
          <div className="bill-summary__fact">
            <div className="bill-summary__fact-label">Possible overcharge</div>
            <div className="bill-summary__fact-value">{toCurrency(estimatedOvercharge)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
