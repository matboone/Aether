import type { Types } from "mongoose";

export type SessionStep =
  | "NEW"
  | "INTAKE"
  | "AWAITING_BILL_UPLOAD"
  | "BILL_UPLOADED"
  | "BILL_PARSED"
  | "BILL_ANALYZED"
  | "AWAITING_INCOME"
  | "STRATEGY_READY"
  | "NEGOTIATION_IN_PROGRESS"
  | "RESOLUTION_RECORDED"
  | "COMPLETE"
  | "ERROR";

export type IncomeBracket = "0_50k" | "50k_80k" | "80k_plus";

export type AssistanceOutcome =
  | "full_waiver"
  | "partial_discount"
  | "payment_plan"
  | "unclear";

export type ResolutionType =
  | "full_waiver"
  | "partial_discount"
  | "payment_plan"
  | "waiver"
  | "discount"
  | "no_change";

export type MessageRole = "user" | "assistant" | "system";

export type UploadStatus = "uploaded" | "processing" | "processed" | "failed";

export type ParsedBillSourceType =
  | "itemized_statement"
  | "summary_bill"
  | "unknown";

export type NormalizedBillCategory =
  | "facility"
  | "lab"
  | "imaging"
  | "physician"
  | "medication"
  | "other";

export type FlagSeverity = "low" | "medium" | "high";

export type FlagReason =
  | "above_benchmark"
  | "duplicate_like"
  | "suspicious_facility_fee";

export type ToolName =
  | "extractBillDocument"
  | "classifyBillItems"
  | "analyzeBillPricing"
  | "lookupHospitalPolicy"
  | "qualifyFinancialAssistance"
  | "buildNegotiationPlan"
  | "recordResolution";

export type ToolEventStatus = "success" | "fallback" | "error" | "skipped";

export type SessionFacts = {
  hospitalName?: string;
  hospitalId?: string;
  hasInsurance?: boolean | null;
  incidentSummary?: string;
  estimatedBillTotal?: number | null;
  uploadedBillId?: string;
  parsedBillId?: string;
  analysisId?: string;
  planId?: string | null;
  incomeBracket?: string | null;
  householdSize?: number | null;
  assistanceEligible?: boolean | null;
  negotiationOutcome?: {
    originalAmount?: number | null;
    reducedAmount?: number | null;
    paymentPlanOffered?: boolean | null;
    notes?: string | null;
  } | null;
};

export interface BaseMongoDocument {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionDocument extends BaseMongoDocument {
  step: SessionStep;
  facts: SessionFacts;
}

export interface MessageToolCall {
  name: ToolName;
  input: unknown;
}

export interface MessageToolResult {
  name: ToolName;
  status: ToolEventStatus;
  output: unknown;
}

export interface MessageDocument extends BaseMongoDocument {
  sessionId: Types.ObjectId;
  role: MessageRole;
  content: string;
  toolCalls?: MessageToolCall[];
  toolResults?: MessageToolResult[];
}

export interface UploadedBillDocument extends BaseMongoDocument {
  sessionId: Types.ObjectId;
  filename: string;
  mimeType: string;
  storagePath: string;
  checksum?: string | null;
  extractedText?: string | null;
  status: UploadStatus;
}

export interface ParsedBillLineItem {
  rawLabel: string;
  amount: number | null;
  code?: string | null;
}

export interface ParsedBillDocument extends BaseMongoDocument {
  sessionId: Types.ObjectId;
  uploadedBillId: Types.ObjectId;
  hospitalName: string | null;
  totalAmount: number | null;
  phoneNumber: string | null;
  email: string | null;
  sourceType: ParsedBillSourceType;
  lineItems: ParsedBillLineItem[];
}

export interface FlaggedItem {
  label: string;
  chargedAmount: number;
  benchmarkAmount: number;
  fairRangeLow: number;
  fairRangeHigh: number;
  severity: FlagSeverity;
  reason: FlagReason;
  suggestedTargetAmount: number;
}

export interface AnalyzedItem {
  label: string;
  chargedAmount: number;
  benchmarkAmount?: number | null;
  matched: boolean;
}

export interface BillAnalysisDocument extends BaseMongoDocument {
  sessionId: Types.ObjectId;
  parsedBillId: Types.ObjectId;
  originalTotal: number;
  estimatedOvercharge: number;
  flaggedItems: FlaggedItem[];
  allItems: AnalyzedItem[];
}

export interface AssistanceMatrixEntry {
  incomeBracket: IncomeBracket;
  likelyEligible: boolean;
  likelyOutcome: AssistanceOutcome;
  rationale: string[];
}

export interface HospitalPolicyDocument extends BaseMongoDocument {
  canonicalName: string;
  aliases: string[];
  phoneNumber: string | null;
  billingDepartmentPath: string | null;
  hasFinancialAssistance: boolean;
  uninsuredDiscountAvailable: boolean;
  recommendedSteps: string[];
  negotiationScript: string[];
  assistanceNotes: string[];
  assistanceMatrix: AssistanceMatrixEntry[];
}

export interface ProcedureBenchmarkDocument extends BaseMongoDocument {
  normalizedKey: string;
  code?: string | null;
  displayLabel: string;
  keywords: string[];
  category: NormalizedBillCategory;
  benchmarkAmount: number;
  fairRangeLow: number;
  fairRangeHigh: number;
}

export interface AssistanceAssessment {
  likelyEligible: boolean;
  likelyOutcome: AssistanceOutcome;
  rationale: string[];
}

export interface NegotiationTargetAsk {
  requestItemizedReview: boolean;
  requestSelfPayDiscount: boolean;
  requestFinancialAssistance: boolean;
  requestPaymentPlan: boolean;
}

export interface NegotiationPlanDocument extends BaseMongoDocument {
  sessionId: Types.ObjectId;
  hospitalId: Types.ObjectId;
  analysisId: Types.ObjectId;
  assistanceAssessment: AssistanceAssessment | null;
  nextActions: string[];
  phoneScript: string[];
  targetAsk: NegotiationTargetAsk;
  callInstructions: string[];
}

export interface ResolutionDocument extends BaseMongoDocument {
  sessionId: Types.ObjectId;
  originalAmount: number | null;
  reducedAmount: number | null;
  resolutionType: ResolutionType;
  notes: string | null;
}

export interface ClassifiedBillItem {
  label: string;
  normalizedKey: string;
  code?: string | null;
  chargedAmount: number;
  category: NormalizedBillCategory;
}

export interface AnalysisSummary {
  originalTotal: number;
  flaggedCount: number;
  estimatedOvercharge: number;
}

export interface ToolEvent {
  tool: ToolName;
  status: ToolEventStatus;
  message: string;
  data?: unknown;
}

export interface RenderableSessionUi {
  canUploadBill: boolean;
  canUploadItemizedStatement: boolean;
  analysisSummary?: AnalysisSummary;
  flaggedItems?: FlaggedItem[];
  hospitalStrategy?: {
    hospitalId: string;
    canonicalName: string;
    phoneNumber: string | null;
    billingDepartmentPath: string | null;
    recommendedSteps: string[];
    negotiationScript: string[];
    assistanceNotes: string[];
  } | null;
  negotiationPlan?: {
    planId: string;
    nextActions: string[];
    phoneScript: string[];
    targetAsk: NegotiationTargetAsk;
    callInstructions: string[];
    assistanceAssessment: AssistanceAssessment | null;
  } | null;
  resolutionSummary?: {
    resolutionType: ResolutionType;
    originalAmount: number | null;
    reducedAmount: number | null;
    savingsAmount: number | null;
    notes: string | null;
  } | null;
}

export interface DemoBillTemplate {
  key: string;
  filenameHints: string[];
  textPatterns: string[];
  hospitalName: string;
  totalAmount: number;
  phoneNumber: string;
  email?: string | null;
  sourceType: ParsedBillSourceType;
  checksum?: string;
  lineItems: ParsedBillLineItem[];
}
