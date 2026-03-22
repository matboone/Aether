"use client";

import { CircleCheck, CircleDashed, CircleX } from "lucide-react";
import type { Stage } from "@/app/_types/dashboard";

type PlaceholderStatus = "completed" | "queued" | "pending" | "blocked";

interface StrategyChecklistPlaceholderProps {
  readonly stage: Stage;
  readonly isLoading: boolean;
}

interface Item {
  id: string;
  label: string;
  minStageRank: number;
  statusOverride?: PlaceholderStatus;
}

const STAGE_RANK: Record<Stage, number> = {
  INTRO: 0,
  HOSPITAL_ID: 1,
  INSURANCE_CHECK: 2,
  ITEMIZED_EXPLAIN: 2,
  BILL_UPLOAD: 3,
  BILL_PROCESSING: 4,
  ANALYSIS_COMPLETE: 5,
  INCOME_CHECK: 6,
  ELIGIBILITY_RESULT: 7,
  ACTION_PLAN: 8,
  SCRIPT_GENERATED: 9,
  RESOLVED: 10,
};

const ITEMS: Item[] = [
  { id: "bill", label: "Bill uploaded", minStageRank: 3 },
  { id: "analysis", label: "Analysis completed", minStageRank: 5 },
  { id: "income", label: "Income confirmed", minStageRank: 6 },
  { id: "eligibility", label: "Eligibility reviewed", minStageRank: 7 },
  { id: "plan", label: "Negotiation strategy drafted", minStageRank: 8 },
  { id: "script", label: "Call script prepared", minStageRank: 9 },
  { id: "escalation", label: "Escalation package", minStageRank: 11, statusOverride: "blocked" },
];

function statusFor(item: Item, stage: Stage, isLoading: boolean): PlaceholderStatus {
  if (item.statusOverride) return item.statusOverride;
  if (STAGE_RANK[stage] >= item.minStageRank) return "completed";
  return isLoading ? "pending" : "queued";
}

function StatusIcon({ status }: { readonly status: PlaceholderStatus }) {
  if (status === "completed") {
    return <CircleCheck size={14} className="strategy-placeholder__icon strategy-placeholder__icon--completed" />;
  }
  if (status === "blocked") {
    return <CircleX size={14} className="strategy-placeholder__icon strategy-placeholder__icon--blocked" />;
  }
  if (status === "pending") {
    return <CircleDashed size={14} className="strategy-placeholder__icon strategy-placeholder__icon--pending status-spin" />;
  }
  return <CircleDashed size={14} className="strategy-placeholder__icon strategy-placeholder__icon--pending" />;
}

export function StrategyChecklistPlaceholder({ stage, isLoading }: StrategyChecklistPlaceholderProps) {
  return (
    <section className="strategy-placeholder" aria-label="Strategy checklist placeholders">
      <div className="strategy-placeholder__title">Strategy checklist</div>
      <div className="strategy-placeholder__subtitle">Placeholder progress with check, pending, and X states.</div>
      <ul className="strategy-placeholder__list">
        {ITEMS.map((item) => {
          const status = statusFor(item, stage, isLoading);
          return (
            <li key={item.id} className="strategy-placeholder__item">
              <StatusIcon status={status} />
              <span className="strategy-placeholder__label">{item.label}</span>
              <span className={`strategy-placeholder__pill strategy-placeholder__pill--${status}`}>
                {status === "completed" ? "Done" : status === "blocked" ? "X" : status === "pending" ? "Pending" : "Queued"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
