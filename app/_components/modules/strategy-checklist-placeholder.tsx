"use client";

import { CircleCheck, CircleDashed } from "lucide-react";
import type { SessionFacts } from "@/app/_types/dashboard";

type PlaceholderStatus = "completed" | "queued" | "pending";

interface StrategyChecklistPlaceholderProps {
  readonly isLoading: boolean;
  /** Drive checkmarks from real session data, not stage alone */
  readonly facts: SessionFacts;
  readonly hasNegotiationPlan: boolean;
  readonly hasPhoneScript: boolean;
}

interface Item {
  id: string;
  label: string;
}

const ITEMS: Item[] = [
  { id: "bill", label: "Bill uploaded" },
  { id: "analysis", label: "Analysis completed" },
  { id: "income", label: "Income confirmed" },
  { id: "eligibility", label: "Eligibility reviewed" },
  { id: "plan", label: "Negotiation strategy drafted" },
  { id: "script", label: "Call script prepared" },
  { id: "escalation", label: "Resolution recorded" },
];

function isStepDone(
  id: string,
  facts: SessionFacts,
  hasNegotiationPlan: boolean,
  hasPhoneScript: boolean,
): boolean {
  switch (id) {
    case "bill":
      return Boolean(facts.uploadedBillId);
    case "analysis":
      return Boolean(facts.analysisId);
    case "income":
      return Boolean(facts.incomeBracket);
    case "eligibility":
      return facts.assistanceEligible === "likely" || facts.assistanceEligible === "unlikely";
    case "plan":
      return hasNegotiationPlan;
    case "script":
      return hasNegotiationPlan && hasPhoneScript;
    case "escalation":
      return Boolean(facts.negotiationOutcome);
    default:
      return false;
  }
}

function statusFor(
  item: Item,
  facts: SessionFacts,
  hasNegotiationPlan: boolean,
  hasPhoneScript: boolean,
  isLoading: boolean,
): PlaceholderStatus {
  if (isStepDone(item.id, facts, hasNegotiationPlan, hasPhoneScript)) return "completed";

  const firstPending = ITEMS.find(
    (i) => !isStepDone(i.id, facts, hasNegotiationPlan, hasPhoneScript),
  );
  if (isLoading && firstPending?.id === item.id) return "pending";
  return "queued";
}

function StatusIcon({ status }: { readonly status: PlaceholderStatus }) {
  if (status === "completed") {
    return (
      <CircleCheck size={14} className="strategy-placeholder__icon strategy-placeholder__icon--completed" />
    );
  }
  if (status === "pending") {
    return (
      <CircleDashed
        size={14}
        className="strategy-placeholder__icon strategy-placeholder__icon--pending status-spin"
      />
    );
  }
  return <CircleDashed size={14} className="strategy-placeholder__icon strategy-placeholder__icon--pending" />;
}

export function StrategyChecklistPlaceholder({
  isLoading,
  facts,
  hasNegotiationPlan,
  hasPhoneScript,
}: StrategyChecklistPlaceholderProps) {
  return (
    <section className="strategy-placeholder" aria-label="Strategy checklist">
      <div className="strategy-placeholder__title">Strategy checklist</div>
      <div className="strategy-placeholder__subtitle">Progress updates as you complete each step.</div>
      <ul className="strategy-placeholder__list">
        {ITEMS.map((item) => {
          const status = statusFor(item, facts, hasNegotiationPlan, hasPhoneScript, isLoading);
          return (
            <li key={item.id} className="strategy-placeholder__item">
              <StatusIcon status={status} />
              <span className="strategy-placeholder__label">{item.label}</span>
              <span className={`strategy-placeholder__pill strategy-placeholder__pill--${status}`}>
                {status === "completed" ? "Done" : status === "pending" ? "Pending" : "Queued"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
