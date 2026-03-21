"use client";

/* ═══════════════════════════════════════════════════════
   Module Renderer — maps ModuleType to component
   ═══════════════════════════════════════════════════════ */

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

interface ModuleRendererProps {
  moduleType: ModuleType;
  idx: number;
  engine: ChatEngine;
}

export function ModuleRenderer({ moduleType, idx, engine }: ModuleRendererProps) {
  const delay = idx * 80;

  const cardStyle = (extra: React.CSSProperties = {}) => ({
    animationDelay: `${delay}ms`,
    ...extra,
  });

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
