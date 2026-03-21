"use client";

import { ShieldCheck } from "lucide-react";
import type { AssistanceAssessment } from "@/src/types/domain";

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
        <span className="savings-strip__label">Estimated savings:</span>
        <span className="savings-strip__value">
          {assessment?.likelyOutcome?.replaceAll("_", " ") ?? "Pending assessment"}
        </span>
      </div>
    </div>
  );
}
