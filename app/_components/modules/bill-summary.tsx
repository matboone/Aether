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
  const confidence =
    originalTotal && estimatedOvercharge !== null && originalTotal > 0
      ? Math.min(95, Math.round((estimatedOvercharge / originalTotal) * 100 + 20))
      : null;

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
            <Check size={12} /> Analysis Complete
          </div>
        ) : (
          <div className="status-badge status-badge--analyzing">
            <span className="pulse-dot" />{" "}
            Analyzing…
          </div>
        )}

        <div>
          <div className="confidence-label">Confidence in Reduction</div>
          <div className="confidence-track">
            <div
              className="confidence-fill"
              style={analysisReady ? { width: `${confidence ?? 0}%` } : { animation: "none", width: 0 }}
            />
          </div>
          <div className="confidence-pct">
            {analysisReady && confidence !== null ? `${confidence}%` : "—"}
          </div>
          {analysisReady && estimatedOvercharge !== null && (
            <div className="confidence-label">Potential savings: {toCurrency(estimatedOvercharge)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
