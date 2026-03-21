"use client";

import { Check } from "lucide-react";

interface BillSummaryProps {
  readonly analysisReady: boolean;
}

export function BillSummary({ analysisReady }: BillSummaryProps) {
  return (
    <div className="bill-summary">
      <div className="bill-summary__left">
        <div className="bill-summary__label">BILL SUMMARY</div>
        <div className="bill-summary__hospital-row">
          <div className="monogram">TS</div>
          <div>
            <div className="bill-summary__hospital-name">
              TriStar Medical Center
            </div>
          </div>
        </div>
        <div className="bill-summary__meta">
          Service Date: Jan 15, 2026 &nbsp;&middot;&nbsp; Due: Mar 15, 2026
        </div>
        <div className="bill-summary__total">$6,000.00</div>
      </div>
      <div className="bill-summary__right">
        {analysisReady ? (
          <div className="status-badge status-badge--complete">
            <Check size={12} /> Analysis Complete
          </div>
        ) : (
          <div className="status-badge status-badge--analyzing">
            <span className="pulse-dot" />{" "}
            ANALYZING&hellip;
          </div>
        )}
        <div>
          <div className="confidence-label">Confidence in Reduction</div>
          <div className="confidence-track">
            <div
              className="confidence-fill"
              style={analysisReady ? {} : { animation: "none", width: 0 }}
            />
          </div>
          <div className="confidence-pct">
            {analysisReady ? "75%" : "\u2014"}
          </div>
        </div>
      </div>
    </div>
  );
}
