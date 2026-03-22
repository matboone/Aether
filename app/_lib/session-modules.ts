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
  "doc-chips",
  "resolution",
];

export const RIGHT_PANEL_MODULE_TYPES: Set<ModuleType> = new Set([
  "eligibility",
  "action-plan",
  "phone-script",
  "doc-chips",
]);

function isStrategyStillActive(step: SessionStep): boolean {
  return step !== "RESOLUTION_RECORDED" && step !== "COMPLETE";
}

function isStrategyPhase(step: SessionStep): boolean {
  return step === "STRATEGY_READY" || step === "NEGOTIATION_IN_PROGRESS";
}

function isAwaitingIncomeChoice(step: SessionStep, facts: DomainSessionFacts): boolean {
  return !facts.incomeBracket && (step === "AWAITING_INCOME" || step === "BILL_ANALYZED");
}

function hasEligibilityOutcome(facts: DomainSessionFacts, ui: RenderableSessionUi): boolean {
  return (
    facts.assistanceEligible !== null &&
    facts.assistanceEligible !== undefined
  ) || Boolean(ui.negotiationPlan?.assistanceAssessment);
}

export function nextModules(
  step: SessionStep,
  ui: RenderableSessionUi,
  facts: DomainSessionFacts,
): ModuleType[] {
  const set = new Set<ModuleType>();
  const strategyStillActive = isStrategyStillActive(step);
  const awaitingIncomeChoice = isAwaitingIncomeChoice(step, facts);
  const hasPlan = Boolean(ui.negotiationPlan);
  const hasPlanActions = (ui.negotiationPlan?.nextActions?.length ?? 0) > 0;
  const hasPhoneScript = (ui.negotiationPlan?.phoneScript?.length ?? 0) > 0;
  const hasResolution = !strategyStillActive;
  const strategyPhase = isStrategyPhase(step);

  if (ui.canUploadBill) {
    set.add("upload");
  }

  if (ui.analysisSummary) {
    set.add("bill-summary");
    if ((ui.flaggedItems?.length ?? 0) > 0) {
      set.add("line-items");
    }
  }

  if (awaitingIncomeChoice) {
    set.add("income-selector");
  }

  if (hasEligibilityOutcome(facts, ui)) {
    set.add("eligibility");
  }

  if ((hasPlan || strategyPhase) && strategyStillActive) {
    set.add("action-plan");
    if (hasPlanActions || step === "NEGOTIATION_IN_PROGRESS") {
      set.add("phone-script");
    }
    if (hasPhoneScript) {
      set.add("doc-chips");
    }
  }

  if (ui.resolutionSummary && hasResolution) {
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
