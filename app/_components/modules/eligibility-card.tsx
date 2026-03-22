"use client";

import { ShieldCheck } from "lucide-react";
import type { AssistanceAssessment, AssistanceOutcome } from "@/src/types/domain";

function formatEstimatedSavings(outcome: AssistanceOutcome | undefined): string {
  switch (outcome) {
    case "full_waiver":
      return "Full waiver";
    case "partial_discount":
      return "Partial discount";
    case "payment_plan":
      return "Payment plan";
    case "unclear":
      return "Outcome unclear";
    default:
      return "Pending assessment";
  }
}

interface EligibilityCardProps {
  readonly eligible: boolean | null;
  readonly assessment: AssistanceAssessment | null;
  readonly hospitalName?: string | null;
}

export function EligibilityCard({ eligible, assessment, hospitalName }: EligibilityCardProps) {
  let headline = "Eligibility Pending";
  if (eligible === true) {
    headline = "Likely Eligible";
  } else if (eligible === false) {
    headline = "Likely Ineligible";
  }

  return (
    <div className="eligibility-card">
      <div className="eligibility-card__icon-area">
        <ShieldCheck size={28} />
      </div>
      <div className="eligibility-card__headline">{headline}</div>
      <div className="eligibility-card__sub">
        {assessment?.rationale?.[0] ??
          `Eligibility is based on ${hospitalName ?? "hospital"} policy and your income profile.`}
      </div>
      <div className="savings-strip">
        <span className="savings-strip__label">Estimated savings</span>
        <span className="savings-strip__sep" aria-hidden>
          ·
        </span>
        <span className="savings-strip__value">{formatEstimatedSavings(assessment?.likelyOutcome)}</span>
      </div>
    </div>
  );
}
