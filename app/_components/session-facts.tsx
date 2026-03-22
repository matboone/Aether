"use client";

import React from "react";
import {
  Building2,
  FileText,
  ShieldCheck,
  Target,
  ChevronDown,
  TrendingDown,
  Hash,
  Trash2,
} from "lucide-react";
import type { SessionFacts, Stage } from "@/app/_types/dashboard";
import { formatIncomeBracketLabel } from "@/app/_constants/dashboard";

type SectionFillStatus = "filled" | "partial" | "empty";

/* ─── Modular Fact Card ─── */

function FactCard({
  icon: Icon,
  label,
  isOpen,
  onToggle,
  status,
  children,
}: {
  readonly icon: React.ElementType;
  readonly label: string;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly status?: SectionFillStatus;
  readonly children: React.ReactNode;
}) {
  const statusClass = status ? `fact-card--${status}` : "";
  return (
    <div className={`fact-card ${statusClass}`}>
      <button
        type="button"
        className="fact-card__header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="fact-card__icon-wrap">
          <Icon size={14} />
        </div>
        <span className="fact-card__label">{label}</span>
        {status === "filled" && <span className="fact-card__dot fact-card__dot--filled" />}
        {status === "partial" && <span className="fact-card__dot fact-card__dot--partial" />}
        <ChevronDown
          size={12}
          className={`fact-card__chevron ${isOpen ? "fact-card__chevron--open" : ""}`}
        />
      </button>
      <div className={`fact-card__body ${isOpen ? "fact-card__body--open" : ""}`}>
        {isOpen && children}
      </div>
    </div>
  );
}

function FactRow({
  label,
  flash,
  children,
}: {
  readonly label: string;
  readonly flash?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <div className={`fact-kv ${flash ? "fact-kv--flash" : ""}`}>
      <span className="fact-kv__key">{label}</span>
      <span className="fact-kv__val">{children}</span>
    </div>
  );
}

function Badge({
  variant,
  pulse,
  children,
}: {
  readonly variant: "primary" | "success" | "error" | "muted";
  readonly pulse?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <span className={`fact-pill fact-pill--${variant} ${pulse ? "fact-pill--pulse" : ""}`}>
      {children}
    </span>
  );
}

function MonoChip({ children }: { readonly children: React.ReactNode }) {
  return <span className="fact-mono">{children}</span>;
}

function EmptyVal() {
  return <span className="fact-kv__empty">&mdash;</span>;
}

/* ─── Section fill-status helpers ─── */

function getProviderStatus(f: SessionFacts): SectionFillStatus {
  if (f.hospitalName && f.hospitalId) return "filled";
  if (f.hospitalName || f.hospitalId) return "partial";
  return "empty";
}
function getBillStatus(f: SessionFacts): SectionFillStatus {
  if (f.estimatedBillTotal && f.parsedBillId && f.analysisId) return "filled";
  if (f.estimatedBillTotal || f.uploadedBillId) return "partial";
  return "empty";
}
function getEligibilityStatus(f: SessionFacts): SectionFillStatus {
  if (f.assistanceEligible === "likely" || f.assistanceEligible === "unlikely") return "filled";
  if (f.incomeBracket || f.assistanceEligible === "checking") return "partial";
  return "empty";
}
function getResolutionStatus(f: SessionFacts): "filled" | "empty" {
  const eligibilityDone =
    f.assistanceEligible === "likely" || f.assistanceEligible === "unlikely";
  return f.negotiationOutcome || eligibilityDone ? "filled" : "empty";
}

type ChecklistStatus = "completed" | "active" | "pending";

function ChecklistSection({
  facts,
  stage,
  isLoading,
  incomeConfirmed,
  hasStrategyPlan,
  hasPhoneScript,
}: {
  readonly facts: SessionFacts;
  readonly stage: Stage;
  readonly isLoading: boolean;
  readonly incomeConfirmed: boolean;
  readonly hasStrategyPlan: boolean;
  readonly hasPhoneScript: boolean;
}) {
  const rawItems: Array<{ id: string; label: string; completed: boolean }> = [
    { id: "bill", label: "Bill uploaded", completed: Boolean(facts.uploadedBillId) },
    { id: "analysis", label: "Analysis completed", completed: Boolean(facts.analysisId) },
    { id: "income", label: "Income confirmed", completed: incomeConfirmed },
    {
      id: "eligibility",
      label: "Eligibility reviewed",
      completed: facts.assistanceEligible === "likely" || facts.assistanceEligible === "unlikely",
    },
    { id: "plan", label: "Strategy drafted", completed: hasStrategyPlan },
    { id: "script", label: "Call script prepared", completed: hasPhoneScript },
    {
      id: "resolution",
      label: "Resolution recorded",
      completed:
        stage === "RESOLVED" ||
        facts.assistanceEligible === "likely" ||
        facts.assistanceEligible === "unlikely",
    },
  ];

  // Enforce strict step-by-step completion: a step cannot complete before all prior steps are complete.
  const items = rawItems.map((item, idx) => {
    const previousDone = rawItems.slice(0, idx).every((prev) => prev.completed);
    return {
      ...item,
      completed: item.completed && previousDone,
    };
  });

  const firstIncompleteIdx = items.findIndex((item) => !item.completed);
  const activeIdx = firstIncompleteIdx;

  const statusFor = (idx: number, completed: boolean): ChecklistStatus => {
    if (completed) return "completed";
    if (idx === activeIdx) return "active";
    return "pending";
  };

  return (
    <section className="facts-checklist" aria-label="Checklist">
      <div className="facts-checklist__title">Checklist</div>
      <ul className="facts-checklist__list">
        {items.map((item, idx) => {
          const status = statusFor(idx, item.completed);
          let connectorFill = "0%";
          let dotProgress = "0%";
          if (status === "completed") {
            connectorFill = "100%";
            dotProgress = "100%";
          } else if (status === "active") {
            connectorFill = "50%";
            dotProgress = "50%";
          }

          let statusLabel = "Not started";
          if (status === "completed") {
            statusLabel = "Done";
          } else if (status === "active") {
            statusLabel = "Pending";
          }

          return (
            <li key={item.id} className={`facts-checklist__item facts-checklist__item--${status}`}>
              <div
                className="facts-checklist__rail"
                style={{ "--dot-progress": dotProgress } as React.CSSProperties}
              >
                <span className="facts-checklist__dot" />
                {idx < items.length - 1 && (
                  <span
                    className="facts-checklist__connector"
                    style={{ "--connector-fill": connectorFill } as React.CSSProperties}
                  />
                )}
              </div>
              <div className="facts-checklist__body">
                <span className="facts-checklist__label">{item.label}</span>
                <span className={`facts-checklist__pill facts-checklist__pill--${status}`}>
                  {statusLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── Main component ─── */

interface SessionFactsProps {
  readonly facts: SessionFacts;
  readonly flashFields: Set<string>;
  readonly stage: Stage;
  readonly isLoading: boolean;
  readonly incomeConfirmed: boolean;
  readonly hasStrategyPlan: boolean;
  readonly hasPhoneScript: boolean;
  readonly openSections: Record<string, boolean>;
  readonly techIdsOpen: boolean;
  readonly onToggleSection: (key: string) => void;
  readonly onToggleTechIds: () => void;
  readonly onClearSession: () => void;
}

export function SessionFactsPanel({
  facts,
  flashFields,
  stage,
  isLoading,
  incomeConfirmed,
  hasStrategyPlan,
  hasPhoneScript,
  openSections,
  techIdsOpen,
  onToggleSection,
  onToggleTechIds,
  onClearSession,
}: SessionFactsProps) {
  return (
    <div className="facts-panel">
      {/* Cards */}
      <div className="facts-panel__cards">
        {/* ─ Provider ─ */}
        <FactCard
          icon={Building2}
          label="Provider"
          isOpen={openSections.provider}
          onToggle={() => onToggleSection("provider")}
          status={getProviderStatus(facts)}
        >
          <FactRow label="Hospital" flash={flashFields.has("hospitalName")}>
            {facts.hospitalName ? (
              <div className="fact-hospital">
                <span className="fact-hospital__mono">
                  {facts.hospitalName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <span className="fact-kv__val--bold">{facts.hospitalName}</span>
              </div>
            ) : (
              <EmptyVal />
            )}
          </FactRow>
          <FactRow label="System ID" flash={flashFields.has("hospitalId")}>
            {facts.hospitalId ? <MonoChip>{facts.hospitalId}</MonoChip> : <EmptyVal />}
          </FactRow>
        </FactCard>

        {/* ─ Bill ─ */}
        <FactCard
          icon={FileText}
          label="Bill"
          isOpen={openSections.bill}
          onToggle={() => onToggleSection("bill")}
          status={getBillStatus(facts)}
        >
          <FactRow label="Total" flash={flashFields.has("estimatedBillTotal")}>
            {facts.estimatedBillTotal ? (
              <span className="fact-kv__val--display">{facts.estimatedBillTotal}</span>
            ) : (
              <EmptyVal />
            )}
          </FactRow>

          <button
            className="fact-link"
            onClick={onToggleTechIds}
            style={{ display: "flex", alignItems: "center", gap: "0.25rem", margin: "0.25rem 0" }}
          >
            <Hash size={10} /> IDs
            <ChevronDown
              size={10}
              style={{
                transform: techIdsOpen ? "rotate(180deg)" : "none",
                transition: "transform 200ms ease",
              }}
            />
          </button>
          {techIdsOpen && (
            <div className="fact-ids-grid">
              <FactRow label="Upload" flash={flashFields.has("uploadedBillId")}>
                {facts.uploadedBillId ? <MonoChip>{facts.uploadedBillId}</MonoChip> : <EmptyVal />}
              </FactRow>
              <FactRow label="Parsed" flash={flashFields.has("parsedBillId")}>
                {facts.parsedBillId ? <MonoChip>{facts.parsedBillId}</MonoChip> : <EmptyVal />}
              </FactRow>
              <FactRow label="Analysis" flash={flashFields.has("analysisId")}>
                {facts.analysisId ? <MonoChip>{facts.analysisId}</MonoChip> : <EmptyVal />}
              </FactRow>
            </div>
          )}
        </FactCard>

        {/* ─ Eligibility ─ */}
        <FactCard
          icon={ShieldCheck}
          label="Eligibility"
          isOpen={openSections.eligibility}
          onToggle={() => onToggleSection("eligibility")}
          status={getEligibilityStatus(facts)}
        >
          <FactRow label="Income" flash={flashFields.has("incomeBracket")}>
            {facts.incomeBracket ? (
              <Badge variant="primary">
                {formatIncomeBracketLabel(facts.incomeBracket) ?? facts.incomeBracket}
              </Badge>
            ) : (
              <EmptyVal />
            )}
          </FactRow>
          <FactRow label="Household" flash={flashFields.has("householdSize")}>
            {facts.householdSize ? <Badge variant="primary">{facts.householdSize}</Badge> : <EmptyVal />}
          </FactRow>
          <FactRow label="Status" flash={flashFields.has("assistanceEligible")}>
            {facts.assistanceEligible === "likely" && <Badge variant="success">Likely Eligible</Badge>}
            {facts.assistanceEligible === "unlikely" && <Badge variant="error">Likely Ineligible</Badge>}
            {facts.assistanceEligible === "checking" && <Badge variant="primary" pulse>Checking…</Badge>}
            {!facts.assistanceEligible && <EmptyVal />}
          </FactRow>
        </FactCard>

        {/* ─ Resolution ─ */}
        <FactCard
          icon={Target}
          label="Resolution"
          isOpen={openSections.resolution}
          onToggle={() => onToggleSection("resolution")}
          status={getResolutionStatus(facts)}
        >
          {facts.negotiationOutcome ? (
            <>
              <FactRow label="Original" flash={flashFields.has("negotiationOutcome")}>
                <span className="fact-kv__val--num">
                  ${facts.negotiationOutcome.original.toLocaleString()}
                </span>
              </FactRow>
              <FactRow label="Reduced">
                <span className="fact-kv__val--num fact-kv__val--green">
                  <TrendingDown size={12} />
                  ${facts.negotiationOutcome.reduced.toLocaleString()}
                </span>
              </FactRow>
              <div className="fact-savings">
                Saved ${(facts.negotiationOutcome.original - facts.negotiationOutcome.reduced).toLocaleString()}
              </div>
              <FactRow label="Plan">
                {facts.negotiationOutcome.paymentPlan ? (
                  <Badge variant="success">Yes</Badge>
                ) : (
                  <Badge variant="muted">No</Badge>
                )}
              </FactRow>
              {facts.negotiationOutcome.notes && (
                <p className="fact-note">{facts.negotiationOutcome.notes}</p>
              )}
            </>
          ) : (
            <span className="fact-kv__empty" style={{ fontSize: "0.7rem" }}>
              Not yet recorded
            </span>
          )}
        </FactCard>
      </div>

      <ChecklistSection
        facts={facts}
        stage={stage}
        isLoading={isLoading}
        incomeConfirmed={incomeConfirmed}
        hasStrategyPlan={hasStrategyPlan}
        hasPhoneScript={hasPhoneScript}
      />

      {/* Footer actions */}
      <div className="facts-panel__footer">
        <button className="facts-panel__clear" onClick={onClearSession}>
          <Trash2 size={12} />
          Clear Session
        </button>
      </div>
    </div>
  );
}
