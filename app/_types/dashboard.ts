/* ═══════════════════════════════════════════════════════
   Aether — Dashboard Type Definitions
   ═══════════════════════════════════════════════════════ */

export type Stage =
  | "INTRO"
  | "HOSPITAL_ID"
  | "INSURANCE_CHECK"
  | "ITEMIZED_EXPLAIN"
  | "BILL_UPLOAD"
  | "BILL_PROCESSING"
  | "ANALYSIS_COMPLETE"
  | "INCOME_CHECK"
  | "ELIGIBILITY_RESULT"
  | "ACTION_PLAN"
  | "SCRIPT_GENERATED"
  | "RESOLVED";

export type ModuleType =
  | "upload"
  | "bill-receipt"
  | "bill-summary"
  | "line-items"
  | "income-selector"
  | "eligibility"
  | "action-plan"
  | "doc-chips"
  | "phone-script"
  | "resolution";

export interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  modules?: ModuleType[];
}

export type InsuranceStatus = "insured" | "uninsured" | "unknown";
export type EligibilityStatus = "likely" | "unlikely" | "checking";

export interface NegotiationOutcome {
  original: number;
  reduced: number;
  paymentPlan: boolean;
  notes: string;
}

export interface SessionFacts {
  hospitalName: string | null;
  hospitalId: string | null;
  hasInsurance: InsuranceStatus | null;
  incidentSummary: string | null;
  estimatedBillTotal: string | null;
  uploadedBillId: string | null;
  parsedBillId: string | null;
  analysisId: string | null;
  incomeBracket: string | null;
  householdSize: number | null;
  assistanceEligible: EligibilityStatus | null;
  negotiationOutcome: NegotiationOutcome | null;
}

export type StepStatus = "completed" | "active" | "pending";

export interface ActionStep {
  title: string;
  desc: string;
  status: StepStatus;
}

export interface LineItem {
  desc: string;
  billed: string;
  fair: string;
  flag: string;
  flagType: "error" | "warning" | "ok";
}

export interface Document {
  name: string;
  status: string;
}

export interface ScriptSection {
  label: string;
  text: string;
  isChip: boolean;
}
