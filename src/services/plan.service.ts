import { Types } from "mongoose";
import { ApiError } from "@/src/lib/api";
import { BillAnalysisModel } from "@/src/models/bill-analysis.model";
import { HospitalPolicyModel } from "@/src/models/hospital-policy.model";
import { NegotiationPlanModel } from "@/src/models/negotiation-plan.model";
import type {
  AssistanceAssessment,
  NegotiationTargetAsk,
} from "@/src/types/domain";
import type { BuildStrategyResponseDto } from "@/src/types/dto";

function buildTargetAsk(
  hasFinancialAssistance: boolean,
  uninsuredDiscountAvailable: boolean,
  assistanceAssessment: AssistanceAssessment | null,
): NegotiationTargetAsk {
  return {
    requestItemizedReview: true,
    requestSelfPayDiscount: uninsuredDiscountAvailable,
    requestFinancialAssistance:
      hasFinancialAssistance && Boolean(assistanceAssessment?.likelyEligible),
    requestPaymentPlan:
      !assistanceAssessment?.likelyEligible ||
      assistanceAssessment.likelyOutcome === "payment_plan",
  };
}

export const planService = {
  async buildNegotiationPlan(input: {
    analysisId: string;
    hospitalId: string;
    assistanceAssessment?: {
      likelyEligible: boolean;
      likelyOutcome: string;
    } | null;
  }): Promise<BuildStrategyResponseDto> {
    const analysis = await BillAnalysisModel.findById(input.analysisId).lean();
    if (!analysis) {
      throw new ApiError("ANALYSIS_NOT_FOUND", "Analysis not found", 404);
    }

    const hospital = await HospitalPolicyModel.findById(input.hospitalId).lean();
    if (!hospital) {
      throw new ApiError("HOSPITAL_NOT_FOUND", "Hospital policy not found", 404);
    }

    const incomingAssessment = input.assistanceAssessment ?? null;
    const assessment = incomingAssessment
      ? {
          likelyEligible: incomingAssessment.likelyEligible,
          likelyOutcome:
            incomingAssessment.likelyOutcome as AssistanceAssessment["likelyOutcome"],
          rationale: [],
        }
      : null;

    const targetAsk = buildTargetAsk(
      hospital.hasFinancialAssistance,
      hospital.uninsuredDiscountAvailable,
      assessment,
    );

    const topFlags = analysis.flaggedItems.slice(0, 3);
    const nextActions = [
      `Call ${hospital.canonicalName} billing at ${hospital.phoneNumber ?? "the billing office number on the bill"}.`,
      "Ask for an itemized billing review of the highest flagged charges.",
      ...hospital.recommendedSteps,
    ];

    if (assessment?.likelyEligible) {
      nextActions.push("Request the financial assistance screening during the same call.");
    }

    const phoneScript = [
      ...hospital.negotiationScript,
      ...topFlags.map(
        (flag: {
          label: string;
          chargedAmount: number;
        }) =>
          `I am specifically calling about ${flag.label} at $${flag.chargedAmount}, which appears above the seeded fair range.`,
      ),
    ];

    const callInstructions = [
      "Stay on the line until a billing review case number is provided.",
      "Write down any revised balance or promised follow-up timeline.",
      "If the first representative cannot help, ask for a supervisor review.",
    ];

    const plan = await NegotiationPlanModel.create({
      sessionId: new Types.ObjectId(analysis.sessionId),
      hospitalId: new Types.ObjectId(hospital._id),
      analysisId: new Types.ObjectId(analysis._id),
      assistanceAssessment: assessment,
      nextActions,
      phoneScript,
      targetAsk,
      callInstructions,
    });

    return {
      planId: plan._id.toString(),
      nextActions,
      phoneScript,
      targetAsk,
      callInstructions,
      assistanceAssessment: assessment,
    };
  },

  async getPlanById(planId: string) {
    const plan = await NegotiationPlanModel.findById(planId).lean();
    if (!plan) {
      throw new ApiError("PLAN_NOT_FOUND", "Negotiation plan not found", 404);
    }
    return plan;
  },
};
