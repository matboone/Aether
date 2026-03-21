import type {
  AssistanceAssessment,
  AnalysisSummary,
  ClassifiedBillItem,
  FlaggedItem,
  ParsedBillSourceType,
  RenderableSessionUi,
  SessionFacts,
  SessionStep,
  ToolEvent,
} from "@/src/types/domain";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CreateSessionResponseDto {
  sessionId: string;
  step: SessionStep;
  facts: SessionFacts;
  ui: RenderableSessionUi;
}

export interface GetSessionResponseDto extends CreateSessionResponseDto {
  analysisId?: string;
  hospitalId?: string;
  planId?: string;
}

export interface ChatMessageRequestDto {
  sessionId: string;
  content: string;
  factPatch?: Partial<SessionFacts>;
  incomeInput?: {
    incomeBracket?: string | null;
    incomeAmount?: number | null;
    householdSize?: number | null;
  };
  resolutionInput?: {
    reducedAmount?: number | null;
    resolutionType?: "waiver" | "discount" | "payment_plan" | "no_change";
    notes?: string | null;
  };
}

export interface ChatMessageResponseDto {
  sessionId: string;
  assistantMessage: string;
  step: SessionStep;
  facts: SessionFacts;
  toolEvents: ToolEvent[];
  ui: RenderableSessionUi;
}

export interface UploadBillResponseDto {
  uploadedBillId: string;
  sessionId: string;
  filename: string;
  status: string;
}

export interface ProcessBillResponseDto {
  sessionId: string;
  uploadedBillId: string;
  parsedBillId: string;
  analysisId: string;
  step: SessionStep;
  facts: SessionFacts;
  toolEvents: ToolEvent[];
  ui: RenderableSessionUi;
}

export interface ExtractBillDocumentOutputDto {
  parsedBillId: string;
  hospitalName: string | null;
  totalAmount: number | null;
  phoneNumber: string | null;
  email: string | null;
  lineItems: Array<{
    rawLabel: string;
    amount: number | null;
    code?: string | null;
  }>;
  sourceType: ParsedBillSourceType;
}

export interface ClassifyBillItemsOutputDto {
  normalizedItems: ClassifiedBillItem[];
}

export interface AnalyzeBillPricingOutputDto {
  analysisId: string;
  summary: AnalysisSummary;
  flaggedItems: FlaggedItem[];
  allItems: Array<{
    label: string;
    chargedAmount: number;
    benchmarkAmount?: number | null;
    matched: boolean;
  }>;
}

export interface LookupHospitalPolicyOutputDto {
  hospitalId: string;
  canonicalName: string;
  phoneNumber: string | null;
  billingDepartmentPath: string | null;
  hasFinancialAssistance: boolean;
  uninsuredDiscountAvailable: boolean;
  recommendedSteps: string[];
  negotiationScript: string[];
  assistanceNotes: string[];
}

export interface QualifyFinancialAssistanceRequestDto {
  hospitalId: string;
  incomeBracket: string;
  householdSize?: number;
  hasInsurance?: boolean | null;
}

export interface QualifyFinancialAssistanceResponseDto {
  likelyEligible: boolean;
  likelyOutcome: "full_waiver" | "partial_discount" | "payment_plan" | "unclear";
  rationale: string[];
}

export interface BuildStrategyRequestDto {
  analysisId: string;
  hospitalId: string;
  assistanceAssessment?: {
    likelyEligible: boolean;
    likelyOutcome: string;
  } | null;
}

export interface BuildStrategyResponseDto {
  planId: string;
  nextActions: string[];
  phoneScript: string[];
  targetAsk: {
    requestItemizedReview: boolean;
    requestSelfPayDiscount: boolean;
    requestFinancialAssistance: boolean;
    requestPaymentPlan: boolean;
  };
  callInstructions: string[];
  assistanceAssessment: AssistanceAssessment | null;
}

export interface RecordResolutionRequestDto {
  sessionId: string;
  reducedAmount?: number | null;
  resolutionType: "waiver" | "discount" | "payment_plan" | "no_change";
  notes?: string | null;
}

export interface RecordResolutionResponseDto {
  resolutionRecorded: true;
  sessionId: string;
  resolutionId: string;
  step: SessionStep;
  facts: SessionFacts;
  ui: RenderableSessionUi;
}

export interface QuickScanResponseDto {
  parseResult: {
    hospitalName: string | null;
    totalAmount: number | null;
    phoneNumber: string | null;
    email: string | null;
    sourceType: ParsedBillSourceType;
    lineItems: Array<{
      rawLabel: string;
      amount: number | null;
      code?: string | null;
    }>;
  };
  analysisSummary: AnalysisSummary;
  flaggedItems: FlaggedItem[];
  allItems: Array<{
    label: string;
    chargedAmount: number;
    benchmarkAmount?: number | null;
    matched: boolean;
  }>;
  unmatchedItems: Array<{
    label: string;
    chargedAmount: number;
  }>;
}
