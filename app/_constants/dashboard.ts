/* ═══════════════════════════════════════════════════════
   Aether — Dashboard Constants & Mock Data
   ═══════════════════════════════════════════════════════ */

import { LayoutDashboard, FileText, FolderOpen } from "lucide-react";
import type {
  Stage,
  SessionFacts,
  ActionStep,
  LineItem,
  Document,
  ScriptSection,
} from "@/app/_types/dashboard";

/* ─── Stage Labels ─── */

export const STAGE_LABELS: Record<Stage, string> = {
  INTRO: "STEP 1: WELCOME",
  HOSPITAL_ID: "STEP 2: HOSPITAL INFO",
  INSURANCE_CHECK: "STEP 3: INSURANCE",
  ITEMIZED_EXPLAIN: "STEP 3B: ITEMIZED BILLS",
  BILL_UPLOAD: "STEP 4: BILL UPLOAD",
  BILL_PROCESSING: "STEP 5: PROCESSING",
  ANALYSIS_COMPLETE: "STEP 6: ANALYSIS",
  INCOME_CHECK: "STEP 7: INCOME CHECK",
  ELIGIBILITY_RESULT: "STEP 8: ELIGIBILITY",
  ACTION_PLAN: "STEP 9: ACTION PLAN",
  SCRIPT_GENERATED: "STEP 10: CALL SCRIPT",
  RESOLVED: "RESOLVED",
};

/* ─── Suggestion Chips per Stage ─── */

export const SUGGESTION_CHIPS: Partial<Record<Stage, string[]>> = {
  INTRO: ["I have an unpaid hospital bill", "I got a bill I can't afford"],
  HOSPITAL_ID: [
    "TriStar Medical Center",
    "Vanderbilt / HCA",
    "Not sure of the name",
  ],
  INSURANCE_CHECK: ["No insurance", "I'm underinsured", "I have insurance"],
  ITEMIZED_EXPLAIN: ["I don't have one", "What is an itemized bill?"],
  ANALYSIS_COMPLETE: [
    "Tell me about the flagged charges",
    "What should I do first?",
  ],
};

/* ─── Empty Facts ─── */

export const EMPTY_FACTS: SessionFacts = {
  hospitalName: null,
  hospitalId: null,
  hasInsurance: null,
  incidentSummary: null,
  estimatedBillTotal: null,
  uploadedBillId: null,
  parsedBillId: null,
  analysisId: null,
  incomeBracket: null,
  householdSize: null,
  assistanceEligible: null,
  negotiationOutcome: null,
};

/* ─── Sidebar Navigation ─── */

export const SIDEBAR_ICONS = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: FileText, label: "Bills" },
  { icon: FolderOpen, label: "Documents" },
] as const;

/* ─── Income Options ─── */

export const INCOME_OPTIONS = [
  "Under $25k",
  "$25k\u2013$40k",
  "$40k\u2013$60k",
  "$60k\u2013$80k",
  "$80k+",
  "Prefer not to say",
];

/* ─── Line Items Mock Data ─── */

export const LINE_ITEMS: LineItem[] = [
  {
    desc: "Emergency Room Visit \u2014 Level 5",
    billed: "$2,800",
    fair: "$1,450",
    flag: "Likely overcharge",
    flagType: "error",
  },
  {
    desc: "IV Therapy \u2014 Standard Saline",
    billed: "$847",
    fair: "$200",
    flag: "Likely overcharge",
    flagType: "error",
  },
  {
    desc: "CT Scan \u2014 Abdomen w/ Contrast",
    billed: "$1,200",
    fair: "$1,100",
    flag: "Looks fair",
    flagType: "ok",
  },
  {
    desc: "Blood Panel \u2014 Comprehensive",
    billed: "$653",
    fair: "$300",
    flag: "Possible duplicate",
    flagType: "warning",
  },
  {
    desc: "Physician Consultation",
    billed: "$250",
    fair: "$220",
    flag: "Looks fair",
    flagType: "ok",
  },
  {
    desc: "Medication \u2014 Zofran 4mg IV",
    billed: "$150",
    fair: "$30",
    flag: "Likely overcharge",
    flagType: "error",
  },
  {
    desc: "Facility Fee \u2014 Observation",
    billed: "$100",
    fair: "$100",
    flag: "Looks fair",
    flagType: "ok",
  },
];

/* ─── Action Plan Steps ─── */

export const ACTION_STEPS: ActionStep[] = [
  {
    title: "Request Itemized Bill",
    desc: "Get a detailed breakdown of every charge from TriStar\u2019s billing department.",
    status: "completed",
  },
  {
    title: "Apply for Charity Care",
    desc: "Submit HCA\u2019s financial assistance application with income documentation.",
    status: "active",
  },
  {
    title: "Dispute Overcharges",
    desc: "Challenge flagged line items using fair-pricing data and your dispute letter.",
    status: "pending",
  },
  {
    title: "Request Payment Plan",
    desc: "Negotiate an interest-free payment plan for any remaining balance.",
    status: "pending",
  },
];

/* ─── Generated Documents ─── */

export const DOCUMENTS: Document[] = [
  { name: "Dispute Letter", status: "Ready" },
  { name: "Charity Care Application", status: "Ready" },
  { name: "Call Script \u2014 TriStar Billing", status: "Ready" },
  { name: "Payment Plan Request", status: "Draft" },
];

/* ─── Phone Script Sections ─── */

export const SCRIPT_SECTIONS: ScriptSection[] = [
  {
    label: "OPENING",
    text: "Hello, my name is [Name] and I\u2019m calling about invoice #89211. I received this bill for emergency services on January 15th, and I\u2019d like to discuss my options.",
    isChip: false,
  },
  {
    label: "KEY ASK",
    text: "I\u2019d like to apply for your financial assistance program. I understand TriStar has charity care for patients under 200% of the Federal Poverty Level, and I believe I qualify based on my household income.",
    isChip: false,
  },
  {
    label: "IF THEY PUSH BACK",
    text: "I can provide income documentation. Can you please transfer me to the financial counseling department? I\u2019d also like to request a detailed review of my itemized bill, as I\u2019ve identified some charges that appear inconsistent with typical rates.",
    isChip: false,
  },
  {
    label: "BILLING DIRECT LINE",
    text: "615-342-1000 \u2192 Press 3 \u2192 Press 2 \u2192 Ask for Financial Counseling",
    isChip: true,
  },
];
