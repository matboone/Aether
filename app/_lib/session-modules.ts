import type { ModuleType } from "@/app/_types/dashboard";
import type { RenderableSessionUi, SessionFacts as DomainSessionFacts, SessionStep } from "@/src/types/domain";

export const MODULE_ORDER: ModuleType[] = [
  "upload",
  "bill-summary",
  "line-items",
  "income-selector",
  "eligibility",
  "action-plan",
  "phone-script",
  "resolution",
];

export const RIGHT_PANEL_MODULE_TYPES: Set<ModuleType> = new Set([
  "action-plan",
  "phone-script",
]);

export function nextModules(
  step: SessionStep,
  ui: RenderableSessionUi,
  facts: DomainSessionFacts,
): ModuleType[] {
  const set = new Set<ModuleType>();
  const strategyStillActive = step !== "RESOLUTION_RECORDED" && step !== "COMPLETE";

  if (ui.canUploadBill) set.add("upload");
  if (ui.analysisSummary) {
    set.add("bill-summary");
    if ((ui.flaggedItems?.length ?? 0) > 0) {
      set.add("line-items");
    }
  }
  const awaitingIncomeChoice =
    !facts.incomeBracket && (step === "AWAITING_INCOME" || step === "BILL_ANALYZED");
  if (awaitingIncomeChoice) {
    set.add("income-selector");
  }
  if (facts.assistanceEligible !== null && facts.assistanceEligible !== undefined) {
    set.add("eligibility");
  }
  if (ui.negotiationPlan && strategyStillActive) {
    set.add("action-plan");
    set.add("phone-script");
    if (ui.negotiationPlan.assistanceAssessment) {
      set.add("eligibility");
    }
  }
  if (ui.resolutionSummary && (step === "RESOLUTION_RECORDED" || step === "COMPLETE")) {
    set.add("resolution");
  }

  return MODULE_ORDER.filter((moduleType) => set.has(moduleType));
}

export function rightPanelModulesFromUi(
  step: SessionStep,
  ui: RenderableSessionUi,
  facts: DomainSessionFacts,
): ModuleType[] {
  return nextModules(step, ui, facts).filter((m) => RIGHT_PANEL_MODULE_TYPES.has(m));
}
