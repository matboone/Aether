"use client";

/* ═══════════════════════════════════════════════════════
   Module Renderer — maps ModuleType to component
   with skeleton loading placeholders
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, CircleCheck, CircleDashed, CircleX, LoaderCircle } from "lucide-react";
import type { ModuleType } from "@/app/_types/dashboard";
import type { ChatEngine } from "@/app/_hooks/use-chat-engine";
import { UploadZone } from "./upload-zone";
import { BillReceipt } from "./bill-receipt";
import { BillSummary } from "./bill-summary";
import { LineItemsTable } from "./line-items-table";
import { IncomeSelector } from "./income-selector";
import { EligibilityCard } from "./eligibility-card";
import { ActionPlan } from "./action-plan";
import { DocChips } from "./doc-chips";
import { PhoneScript } from "./phone-script";
import { ResolutionSummary } from "./resolution-summary";

/* ─── Skeleton Variants ─── */

function SkeletonUpload() {
  return (
    <div style={{ padding: "1.5rem", textAlign: "center" }}>
      <div className="skeleton skeleton-circle" style={{ width: 48, height: 48, margin: "0 auto 0.75rem" }} />
      <div className="skeleton skeleton-line skeleton-line--medium" style={{ margin: "0 auto 0.4rem" }} />
      <div className="skeleton skeleton-line skeleton-line--short" style={{ margin: "0 auto 1rem" }} />
      <div className="skeleton" style={{ width: 120, height: 36, borderRadius: "100vmax", margin: "0 auto" }} />
    </div>
  );
}

function SkeletonBillSummary() {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ flex: 1, padding: "1rem" }}>
        <div className="skeleton skeleton-line skeleton-line--short" />
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "0.5rem" }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "0.625rem" }} />
          <div className="skeleton skeleton-line skeleton-line--medium" style={{ marginBottom: 0 }} />
        </div>
        <div className="skeleton skeleton-line skeleton-line--long" />
        <div className="skeleton" style={{ width: "50%", height: "2.5rem", borderRadius: "0.5rem" }} />
      </div>
      <div style={{ width: 200, padding: "1rem", background: "var(--clr-surface-container)" }}>
        <div className="skeleton" style={{ width: 100, height: 22, borderRadius: "100vmax", marginBottom: "0.75rem" }} />
        <div className="skeleton skeleton-line skeleton-line--full" />
        <div className="skeleton" style={{ height: 5, borderRadius: "100vmax", marginBottom: "0.5rem" }} />
        <div className="skeleton skeleton-line skeleton-line--short" style={{ marginLeft: "auto" }} />
      </div>
    </div>
  );
}

function SkeletonLineItems() {
  return (
    <>
      <div style={{ display: "flex", gap: "0.625rem", marginBottom: "0.75rem" }}>
        <div className="skeleton skeleton-line skeleton-line--short" style={{ marginBottom: 0 }} />
        <div className="skeleton" style={{ width: 70, height: 18, borderRadius: "100vmax" }} />
      </div>
      {[1, 2, 3].map((n) => (
        <div key={n} className="skeleton" style={{ height: 36, borderRadius: "0.5rem", marginBottom: "0.375rem" }} />
      ))}
    </>
  );
}

function SkeletonIncomeSelector() {
  return (
    <>
      <div className="skeleton skeleton-header" />
      <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1rem" }}>
        <div className="skeleton skeleton-line skeleton-line--short" style={{ marginBottom: 0 }} />
        <div className="skeleton skeleton-circle" style={{ width: 28, height: 28 }} />
        <div className="skeleton" style={{ width: 24, height: 24, borderRadius: "0.25rem" }} />
        <div className="skeleton skeleton-circle" style={{ width: 28, height: 28 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="skeleton" style={{ height: 36, borderRadius: "100vmax" }} />
        ))}
      </div>
    </>
  );
}

function SkeletonEligibility() {
  return (
    <div style={{ textAlign: "center", padding: "1.25rem" }}>
      <div className="skeleton skeleton-circle" style={{ width: 52, height: 52, margin: "0 auto 0.75rem" }} />
      <div className="skeleton skeleton-line skeleton-line--medium" style={{ margin: "0 auto 0.375rem" }} />
      <div className="skeleton skeleton-line skeleton-line--long" style={{ margin: "0 auto 0.5rem" }} />
      <div className="skeleton skeleton-line skeleton-line--medium" style={{ margin: "0 auto 1rem" }} />
      <div className="skeleton" style={{ height: 40, borderRadius: "var(--radius-card)", marginBottom: "1rem" }} />
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <div className="skeleton" style={{ width: 160, height: 36, borderRadius: "100vmax" }} />
        <div className="skeleton" style={{ width: 160, height: 36, borderRadius: "100vmax" }} />
      </div>
    </div>
  );
}

function SkeletonActionPlan() {
  return (
    <>
      <div className="skeleton skeleton-header" />
      <div className="skeleton skeleton-line skeleton-line--medium" style={{ marginBottom: "1rem" }} />
      {[1, 2, 3].map((n) => (
        <div key={n} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div className="skeleton skeleton-circle" style={{ width: 28, height: 28, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line skeleton-line--medium" />
            <div className="skeleton skeleton-line skeleton-line--long" />
            <div className="skeleton" style={{ width: 60, height: 18, borderRadius: "100vmax" }} />
          </div>
        </div>
      ))}
    </>
  );
}

function SkeletonDocChips() {
  return (
    <>
      <div className="skeleton skeleton-line skeleton-line--short" style={{ marginBottom: "0.625rem" }} />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {[1, 2, 3].map((n) => (
          <div key={n} className="skeleton" style={{ width: 140, height: 80, borderRadius: "var(--radius-card)" }} />
        ))}
      </div>
    </>
  );
}

function SkeletonPhoneScript() {
  return (
    <>
      <div className="skeleton" style={{ height: 44, borderRadius: "var(--radius-card) var(--radius-card) 0 0" }} />
      <div style={{ padding: "1rem" }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ marginBottom: "0.75rem" }}>
            <div className="skeleton skeleton-line skeleton-line--short" />
            <div className="skeleton skeleton-line skeleton-line--long" />
            <div className="skeleton skeleton-line skeleton-line--medium" />
          </div>
        ))}
      </div>
    </>
  );
}

function SkeletonResolution() {
  return (
    <div style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ flex: 1 }}>
            <div className="skeleton skeleton-line skeleton-line--short" />
            <div className="skeleton" style={{ height: "2.25rem", borderRadius: "0.5rem" }} />
          </div>
        ))}
      </div>
      <div className="skeleton" style={{ width: "45%", height: 100, borderRadius: "var(--radius-card-lg)", marginLeft: "auto" }} />
    </div>
  );
}

function SkeletonReceipt() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem" }}>
      <div className="skeleton skeleton-circle" style={{ width: 20, height: 20 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-line skeleton-line--medium" />
        <div className="skeleton skeleton-line skeleton-line--short" />
      </div>
      <div className="skeleton" style={{ width: 70, height: 22, borderRadius: "100vmax" }} />
    </div>
  );
}

/* ─── Skeleton map ─── */

const SKELETON_MAP: Record<ModuleType, React.FC> = {
  "upload": SkeletonUpload,
  "bill-receipt": SkeletonReceipt,
  "bill-summary": SkeletonBillSummary,
  "line-items": SkeletonLineItems,
  "income-selector": SkeletonIncomeSelector,
  "eligibility": SkeletonEligibility,
  "action-plan": SkeletonActionPlan,
  "doc-chips": SkeletonDocChips,
  "phone-script": SkeletonPhoneScript,
  "resolution": SkeletonResolution,
};

/* Loading durations per module type (ms) */
const LOAD_DELAYS: Partial<Record<ModuleType, number>> = {
  "bill-summary": 900,
  "line-items": 1900,
  "eligibility": 2900,
  "action-plan": 500,
  "doc-chips": 400,
  "phone-script": 600,
  "resolution": 900,
};

/* Human-readable labels for the minimizable header */
const MODULE_LABELS: Record<ModuleType, string> = {
  "upload": "Upload Bill",
  "bill-receipt": "Bill Receipt",
  "bill-summary": "Bill Summary",
  "line-items": "Flagged Line Items",
  "income-selector": "Income Selector",
  "eligibility": "Eligibility",
  "action-plan": "Action Plan",
  "doc-chips": "Generated Documents",
  "phone-script": "Call Script",
  "resolution": "Resolution Summary",
};

const NON_MINIMIZABLE_MODULES: Set<ModuleType> = new Set([
  "bill-summary",
  "line-items",
  "eligibility",
]);

interface ModuleRendererProps {
  readonly moduleType: ModuleType;
  readonly idx: number;
  readonly engine: ChatEngine;
  /** When true, skip the minimize chrome (used for right-panel rendering) */
  readonly bare?: boolean;
}

type ModuleStatus = "completed" | "queued" | "pending" | "blocked";

function getModuleStatus(moduleType: ModuleType, engine: ChatEngine): ModuleStatus {
  const unresolved = engine.isTyping || engine.isUploading ? "pending" : "queued";
  switch (moduleType) {
    case "upload":
      return engine.uploaded || Boolean(engine.facts.uploadedBillId) ? "completed" : unresolved;
    case "bill-summary":
      return engine.analysisReady ? "completed" : unresolved;
    case "line-items":
      return engine.analysisReady ? "completed" : unresolved;
    case "income-selector":
      return engine.incomeConfirmed ? "completed" : unresolved;
    case "eligibility":
      if (engine.facts.assistanceEligible === "likely") return "completed";
      if (engine.facts.assistanceEligible === "unlikely") return "blocked";
      return unresolved;
    case "action-plan":
      return engine.backendUi?.negotiationPlan ? "completed" : unresolved;
    case "doc-chips":
      return engine.backendUi?.negotiationPlan ? "completed" : unresolved;
    case "phone-script":
      return (engine.backendUi?.negotiationPlan?.phoneScript?.length ?? 0) > 0 ? "completed" : unresolved;
    case "resolution":
      return engine.facts.negotiationOutcome ? "completed" : unresolved;
    case "bill-receipt":
      return engine.uploaded ? "completed" : unresolved;
    default:
      return unresolved;
  }
}

function ModuleStatusBadge({ status }: { readonly status: ModuleStatus }) {
  if (status === "completed") {
    return (
      <span className="module-status-badge module-status-badge--completed">
        <CircleCheck size={12} />
        Done
      </span>
    );
  }
  if (status === "queued") {
    return (
      <span className="module-status-badge module-status-badge--queued">
        <CircleDashed size={12} />
        Queued
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="module-status-badge module-status-badge--blocked">
        <CircleX size={12} />
        X
      </span>
    );
  }
  return (
    <span className="module-status-badge module-status-badge--pending">
      <LoaderCircle size={12} className="status-spin" />
      Pending
    </span>
  );
}

export function ModuleRenderer({ moduleType, idx, engine, bare }: ModuleRendererProps) {
  const delay = idx * 80;
  const loadDelay = LOAD_DELAYS[moduleType] ?? 0;
  const [loading, setLoading] = useState(loadDelay > 0);
  const forceExpanded = NON_MINIMIZABLE_MODULES.has(moduleType);
  const isMinimized = !forceExpanded && engine.minimizedModules.has(moduleType);
  const moduleStatus = getModuleStatus(moduleType, engine);

  let inferredEligible: boolean | null = null;
  if (engine.facts.assistanceEligible === "likely") {
    inferredEligible = true;
  } else if (engine.facts.assistanceEligible === "unlikely") {
    inferredEligible = false;
  }

  useEffect(() => {
    if (loadDelay <= 0) return;
    const timer = setTimeout(() => setLoading(false), loadDelay);
    return () => clearTimeout(timer);
  }, [loadDelay]);

  const cardStyle = (extra: React.CSSProperties = {}) => ({
    animationDelay: `${delay}ms`,
    ...extra,
  });

  /* ─── Show skeleton while "loading" ─── */
  if (loading) {
    const Skeleton = SKELETON_MAP[moduleType];
    return (
      <div className="module-card" style={cardStyle()}>
        <Skeleton />
      </div>
    );
  }

  /* ─── Minimize header (shown on all modules unless bare) ─── */
  const HeaderContent = (
    <>
      <span className="module-card__min-label">{MODULE_LABELS[moduleType]}</span>
      <span className="module-card__min-right">
        <ModuleStatusBadge status={moduleStatus} />
        {!bare && !forceExpanded && (isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
      </span>
    </>
  );

  const MinHeader = bare || forceExpanded ? (
    <div className="module-card__min-header module-card__min-header--static">
      {HeaderContent}
    </div>
  ) : (
    <button
      type="button"
      className="module-card__min-header"
      onClick={() => engine.toggleMinimize(moduleType)}
      aria-expanded={!isMinimized}
    >
      {HeaderContent}
    </button>
  );

  if (isMinimized && !bare) {
    return (
      <div className="module-card module-card--minimized" style={cardStyle()}>
        {MinHeader}
      </div>
    );
  }

  const wrapCard = (children: React.ReactNode, extra: React.CSSProperties = {}) => (
    <div className="module-card" style={cardStyle(extra)}>
      {MinHeader}
      {children}
    </div>
  );

  switch (moduleType) {
    case "upload":
      return wrapCard(
        <UploadZone
          uploaded={engine.uploaded}
          uploading={engine.isUploading}
          filename={engine.uploadFilename}
          sizeLabel={engine.uploadSizeLabel}
          onUpload={engine.handleUpload}
        />,
      );
    case "bill-receipt":
      return wrapCard(<BillReceipt />);
    case "bill-summary":
      return wrapCard(
        <BillSummary
          analysisReady={engine.analysisReady}
          hospitalName={engine.facts.hospitalName}
          totalAmount={engine.backendUi?.analysisSummary?.originalTotal ?? null}
          analysisSummary={engine.backendUi?.analysisSummary}
        />,
        { padding: 0, overflow: "hidden" },
      );
    case "line-items":
      return wrapCard(
        <LineItemsTable
          showMore={engine.showMoreItems}
          onShowMore={() => engine.setShowMoreItems(true)}
          flaggedItems={engine.backendUi?.flaggedItems ?? []}
          analysisSummary={engine.backendUi?.analysisSummary}
        />,
      );
    case "income-selector":
      return wrapCard(
        <IncomeSelector
          selectedIncome={engine.selectedIncome}
          householdSize={engine.householdSize}
          confirmed={engine.incomeConfirmed}
          onSelect={(opt) => engine.setSelectedIncome(opt)}
          onHouseholdChange={engine.setHouseholdSize}
          onConfirm={engine.handleIncomeConfirm}
        />,
      );
    case "eligibility":
      return wrapCard(
        <EligibilityCard
          eligible={engine.backendUi?.negotiationPlan?.assistanceAssessment?.likelyEligible ?? inferredEligible}
          assessment={engine.backendUi?.negotiationPlan?.assistanceAssessment ?? null}
          hospitalName={engine.backendUi?.hospitalStrategy?.canonicalName ?? engine.facts.hospitalName}
        />,
      );
    case "action-plan":
      return wrapCard(
        <ActionPlan nextActions={engine.backendUi?.negotiationPlan?.nextActions ?? []} />,
      );
    case "doc-chips":
      return wrapCard(
        <DocChips nextActions={engine.backendUi?.negotiationPlan?.nextActions ?? []} />,
      );
    case "phone-script":
      return wrapCard(
        <PhoneScript
          hospitalName={engine.backendUi?.hospitalStrategy?.canonicalName ?? engine.facts.hospitalName}
          lines={engine.backendUi?.negotiationPlan?.phoneScript ?? []}
        />,
      );
    case "resolution":
      return wrapCard(
        <ResolutionSummary summary={engine.backendUi?.resolutionSummary ?? null} />,
      );
    default:
      return null;
  }
}
