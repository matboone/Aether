"use client";

/* ═══════════════════════════════════════════════════════
   Module Renderer — maps ModuleType to component
   with skeleton loading placeholders
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
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
  "bill-summary": 800,
  "line-items": 600,
  "eligibility": 700,
  "action-plan": 500,
  "doc-chips": 400,
  "phone-script": 600,
  "resolution": 900,
};

interface ModuleRendererProps {
  readonly moduleType: ModuleType;
  readonly idx: number;
  readonly engine: ChatEngine;
}

export function ModuleRenderer({ moduleType, idx, engine }: ModuleRendererProps) {
  const delay = idx * 80;
  const loadDelay = LOAD_DELAYS[moduleType] ?? 0;

  const [loading, setLoading] = useState(loadDelay > 0);

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

  switch (moduleType) {
    case "upload":
      return (
        <div className="module-card" style={cardStyle()}>
          <UploadZone uploaded={engine.uploaded} onUpload={engine.handleUpload} />
        </div>
      );
    case "bill-receipt":
      return (
        <div className="module-card" style={cardStyle()}>
          <BillReceipt />
        </div>
      );
    case "bill-summary":
      return (
        <div
          className="module-card"
          style={cardStyle({ padding: 0, overflow: "hidden" })}
        >
          <BillSummary analysisReady={engine.analysisReady} />
        </div>
      );
    case "line-items":
      return (
        <div className="module-card" style={cardStyle()}>
          <LineItemsTable
            showMore={engine.showMoreItems}
            onShowMore={() => engine.setShowMoreItems(true)}
          />
        </div>
      );
    case "income-selector":
      return (
        <div className="module-card" style={cardStyle()}>
          <IncomeSelector
            selectedIncome={engine.selectedIncome}
            householdSize={engine.householdSize}
            confirmed={engine.incomeConfirmed}
            onSelect={(opt) => engine.setSelectedIncome(opt)}
            onHouseholdChange={engine.setHouseholdSize}
            onConfirm={engine.handleIncomeConfirm}
          />
        </div>
      );
    case "eligibility":
      return (
        <div className="module-card" style={cardStyle({ animationDelay: `${delay + 200}ms` })}>
          <EligibilityCard />
        </div>
      );
    case "action-plan":
      return (
        <div className="module-card" style={cardStyle()}>
          <ActionPlan />
        </div>
      );
    case "doc-chips":
      return (
        <div className="module-card" style={cardStyle({ animationDelay: `${delay + 160}ms` })}>
          <DocChips />
        </div>
      );
    case "phone-script":
      return (
        <div className="module-card" style={cardStyle({ padding: 0 })}>
          <PhoneScript />
        </div>
      );
    case "resolution":
      return (
        <div className="module-card" style={cardStyle()}>
          <ResolutionSummary />
        </div>
      );
    default:
      return null;
  }
}
