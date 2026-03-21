"use client";

import React from "react";
import { Info, ChevronDown, TrendingDown } from "lucide-react";
import type { SessionFacts, InsuranceStatus } from "@/app/_types/dashboard";

/* ─── Sub-components ─── */

function FactsSection({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="facts-section">
      <div className="facts-section__header" onClick={onToggle}>
        <span className="facts-section__label">{label}</span>
        <ChevronDown
          className={`facts-section__chevron ${isOpen ? "facts-section__chevron--open" : ""}`}
        />
      </div>
      {isOpen && <div className="facts-section__content">{children}</div>}
    </div>
  );
}

function FactEmpty({ label }: { label: string }) {
  return (
    <>
      <span className="fact-row__label">{label}</span>
      <span className="fact-row__value fact-row__value--empty">&mdash;</span>
    </>
  );
}

function InsuranceBadge({ status }: { status: InsuranceStatus }) {
  if (status === "insured")
    return <span className="fact-badge fact-badge--secondary">Insured</span>;
  if (status === "uninsured")
    return <span className="fact-badge fact-badge--error">Uninsured</span>;
  return <span className="fact-badge fact-badge--muted">Unknown</span>;
}

/* ─── Main component ─── */

interface SessionFactsProps {
  facts: SessionFacts;
  flashFields: Set<string>;
  summaryExpanded: boolean;
  openSections: Record<string, boolean>;
  techIdsOpen: boolean;
  onToggleSection: (key: string) => void;
  onToggleTechIds: () => void;
  onToggleSummary: () => void;
  onClearSession: () => void;
}

export function SessionFactsPanel({
  facts,
  flashFields,
  summaryExpanded,
  openSections,
  techIdsOpen,
  onToggleSection,
  onToggleTechIds,
  onToggleSummary,
  onClearSession,
}: SessionFactsProps) {
  return (
    <aside className="aether-facts">
      <div className="facts-header">
        <div className="facts-header__title">
          Session Facts <Info size={14} />
        </div>
        <div className="facts-header__sub">Collected as we talk</div>
      </div>

      {/* SECTION 1 — Provider */}
      <FactsSection
        label="PROVIDER"
        isOpen={openSections.provider}
        onToggle={() => onToggleSection("provider")}
      >
        <div
          className={`fact-row ${flashFields.has("hospitalName") ? "fact-row--flash" : ""}`}
        >
          {facts.hospitalName ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="monogram monogram--sm">
                {facts.hospitalName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span className="fact-row__value fact-row__value--important">
                {facts.hospitalName}
              </span>
            </div>
          ) : (
            <FactEmpty label="Hospital" />
          )}
        </div>
        <div
          className={`fact-row ${flashFields.has("hospitalId") ? "fact-row--flash" : ""}`}
        >
          {facts.hospitalId ? (
            <span className="fact-mono-chip">{facts.hospitalId}</span>
          ) : (
            <FactEmpty label="Hospital ID" />
          )}
        </div>
      </FactsSection>

      {/* SECTION 2 — Patient Context */}
      <FactsSection
        label="PATIENT CONTEXT"
        isOpen={openSections.patient}
        onToggle={() => onToggleSection("patient")}
      >
        <div
          className={`fact-row ${flashFields.has("hasInsurance") ? "fact-row--flash" : ""}`}
        >
          <span className="fact-row__label">Insurance</span>
          {facts.hasInsurance ? (
            <InsuranceBadge status={facts.hasInsurance} />
          ) : (
            <span className="fact-row__value fact-row__value--empty">&mdash;</span>
          )}
        </div>
        <div
          className={`fact-row ${flashFields.has("incidentSummary") ? "fact-row--flash" : ""}`}
          style={{ flexDirection: "column", alignItems: "flex-start" }}
        >
          <span className="fact-row__label">Summary</span>
          {facts.incidentSummary ? (
            <>
              <div
                className={`fact-summary ${summaryExpanded ? "fact-summary--expanded" : ""}`}
              >
                {facts.incidentSummary}
              </div>
              <button className="show-more-link" onClick={onToggleSummary}>
                {summaryExpanded ? "Show less" : "Show more"}
              </button>
            </>
          ) : (
            <span className="fact-row__value fact-row__value--empty">&mdash;</span>
          )}
        </div>
      </FactsSection>

      {/* SECTION 3 — Bill */}
      <FactsSection
        label="BILL"
        isOpen={openSections.bill}
        onToggle={() => onToggleSection("bill")}
      >
        <div
          className={`fact-row ${flashFields.has("estimatedBillTotal") ? "fact-row--flash" : ""}`}
        >
          {facts.estimatedBillTotal ? (
            <span className="fact-row__value fact-row__value--display">
              {facts.estimatedBillTotal}
            </span>
          ) : (
            <FactEmpty label="Estimated Total" />
          )}
        </div>

        {/* Technical IDs sub-section */}
        <div style={{ marginTop: "0.5rem" }}>
          <button
            className="show-more-link"
            onClick={onToggleTechIds}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.65rem",
            }}
          >
            Technical IDs{" "}
            <ChevronDown
              size={10}
              style={{
                transform: techIdsOpen ? "rotate(180deg)" : "none",
                transition: "transform 200ms ease",
              }}
            />
          </button>
          {techIdsOpen && (
            <div className="tech-ids">
              <div
                className={`fact-row ${flashFields.has("uploadedBillId") ? "fact-row--flash" : ""}`}
              >
                <span className="fact-row__label">Upload</span>
                {facts.uploadedBillId ? (
                  <span className="fact-mono-chip">{facts.uploadedBillId}</span>
                ) : (
                  <span className="fact-row__value fact-row__value--empty">&mdash;</span>
                )}
              </div>
              <div
                className={`fact-row ${flashFields.has("parsedBillId") ? "fact-row--flash" : ""}`}
              >
                <span className="fact-row__label">Parsed</span>
                {facts.parsedBillId ? (
                  <span className="fact-mono-chip">{facts.parsedBillId}</span>
                ) : (
                  <span className="fact-row__value fact-row__value--empty">&mdash;</span>
                )}
              </div>
              <div
                className={`fact-row ${flashFields.has("analysisId") ? "fact-row--flash" : ""}`}
              >
                <span className="fact-row__label">Analysis</span>
                {facts.analysisId ? (
                  <span className="fact-mono-chip">{facts.analysisId}</span>
                ) : (
                  <span className="fact-row__value fact-row__value--empty">&mdash;</span>
                )}
              </div>
            </div>
          )}
        </div>
      </FactsSection>

      {/* SECTION 4 — Eligibility */}
      <FactsSection
        label="ELIGIBILITY"
        isOpen={openSections.eligibility}
        onToggle={() => onToggleSection("eligibility")}
      >
        <div
          className={`fact-row ${flashFields.has("incomeBracket") ? "fact-row--flash" : ""}`}
        >
          <span className="fact-row__label">Income</span>
          {facts.incomeBracket ? (
            <span className="fact-badge fact-badge--primary">{facts.incomeBracket}</span>
          ) : (
            <span className="fact-row__value fact-row__value--empty">&mdash;</span>
          )}
        </div>
        <div
          className={`fact-row ${flashFields.has("householdSize") ? "fact-row--flash" : ""}`}
        >
          <span className="fact-row__label">Household</span>
          {facts.householdSize ? (
            <span className="fact-badge fact-badge--primary">{facts.householdSize}</span>
          ) : (
            <span className="fact-row__value fact-row__value--empty">&mdash;</span>
          )}
        </div>
        <div
          className={`fact-row ${flashFields.has("assistanceEligible") ? "fact-row--flash" : ""}`}
        >
          <span className="fact-row__label">Eligible</span>
          {facts.assistanceEligible === "likely" && (
            <span className="fact-badge fact-badge--secondary">Likely Eligible</span>
          )}
          {facts.assistanceEligible === "unlikely" && (
            <span className="fact-badge fact-badge--error">Likely Ineligible</span>
          )}
          {facts.assistanceEligible === "checking" && (
            <span className="fact-badge fact-badge--primary fact-badge--pulse">
              Checking&hellip;
            </span>
          )}
          {!facts.assistanceEligible && (
            <span className="fact-row__value fact-row__value--empty">&mdash;</span>
          )}
        </div>
      </FactsSection>

      {/* SECTION 5 — Resolution */}
      <FactsSection
        label="RESOLUTION"
        isOpen={openSections.resolution}
        onToggle={() => onToggleSection("resolution")}
      >
        {facts.negotiationOutcome ? (
          <>
            <div
              className={`fact-row ${flashFields.has("negotiationOutcome") ? "fact-row--flash" : ""}`}
            >
              <span className="fact-row__label">Original</span>
              <span
                className="fact-row__value"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                ${facts.negotiationOutcome.original.toLocaleString()}
              </span>
            </div>
            <div className="fact-row">
              <span className="fact-row__label">Reduced</span>
              <span
                className="fact-row__value"
                style={{
                  color: "var(--clr-secondary)",
                  fontVariantNumeric: "tabular-nums",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <TrendingDown size={12} />$
                {facts.negotiationOutcome.reduced.toLocaleString()}
              </span>
            </div>
            <div className="fact-row">
              <span className="fact-row__label">Saved</span>
              <span
                className="fact-row__value fact-row__value--important"
                style={{ color: "var(--clr-secondary)" }}
              >
                Saved: $
                {(
                  facts.negotiationOutcome.original -
                  facts.negotiationOutcome.reduced
                ).toLocaleString()}
              </span>
            </div>
            <div className="fact-row">
              <span className="fact-row__label">Plan</span>
              {facts.negotiationOutcome.paymentPlan ? (
                <span className="fact-badge fact-badge--secondary">Yes</span>
              ) : (
                <span className="fact-badge fact-badge--muted">No</span>
              )}
            </div>
            <div
              className="fact-row"
              style={{ flexDirection: "column", alignItems: "flex-start" }}
            >
              <span className="fact-row__label">Notes</span>
              <span
                className="fact-row__value"
                style={{
                  fontStyle: "italic",
                  color: "var(--clr-text-muted)",
                  fontSize: "0.8rem",
                }}
              >
                {facts.negotiationOutcome.notes}
              </span>
            </div>
          </>
        ) : (
          <span
            className="fact-row__value"
            style={{
              color: "var(--clr-text-muted)",
              fontSize: "0.7rem",
              fontWeight: 500,
            }}
          >
            Not yet resolved
          </span>
        )}
      </FactsSection>

      <button className="clear-session-btn" onClick={onClearSession}>
        Clear Session
      </button>
    </aside>
  );
}
