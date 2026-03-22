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
  Settings,
} from "lucide-react";
import type { SessionFacts } from "@/app/_types/dashboard";

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
  readonly status?: "filled" | "partial" | "empty";
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

function getProviderStatus(f: SessionFacts): "filled" | "partial" | "empty" {
  if (f.hospitalName && f.hospitalId) return "filled";
  if (f.hospitalName || f.hospitalId) return "partial";
  return "empty";
}
function getBillStatus(f: SessionFacts): "filled" | "partial" | "empty" {
  if (f.estimatedBillTotal && f.parsedBillId && f.analysisId) return "filled";
  if (f.estimatedBillTotal || f.uploadedBillId) return "partial";
  return "empty";
}
function getEligibilityStatus(f: SessionFacts): "filled" | "partial" | "empty" {
  if (f.assistanceEligible === "likely" || f.assistanceEligible === "unlikely") return "filled";
  if (f.incomeBracket || f.assistanceEligible === "checking") return "partial";
  return "empty";
}
function getResolutionStatus(f: SessionFacts): "filled" | "empty" {
  return f.negotiationOutcome ? "filled" : "empty";
}

/* ─── Main component ─── */

interface SessionFactsProps {
  readonly facts: SessionFacts;
  readonly flashFields: Set<string>;
  readonly summaryExpanded: boolean;
  readonly openSections: Record<string, boolean>;
  readonly techIdsOpen: boolean;
  readonly onToggleSection: (key: string) => void;
  readonly onToggleTechIds: () => void;
  readonly onToggleSummary: () => void;
  readonly onClearSession: () => void;
  readonly onOpenSettings: () => void;
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
  onOpenSettings,
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
            {facts.incomeBracket ? <Badge variant="primary">{facts.incomeBracket}</Badge> : <EmptyVal />}
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
              Not yet resolved
            </span>
          )}
        </FactCard>
      </div>

      {/* Footer actions */}
      <div className="facts-panel__footer">
        <button className="facts-panel__settings" onClick={onOpenSettings} title="Settings">
          <Settings size={14} />
        </button>
        <button className="facts-panel__clear" onClick={onClearSession}>
          <Trash2 size={12} />
          Clear Session
        </button>
      </div>
    </div>
  );
}
