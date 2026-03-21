import { ApiError } from "@/src/lib/api";
import { HospitalPolicyModel } from "@/src/models/hospital-policy.model";
import type {
  AssistanceAssessment,
  IncomeBracket,
} from "@/src/types/domain";
import type { QualifyFinancialAssistanceResponseDto } from "@/src/types/dto";

function normalizeIncomeBracket(
  incomeBracket: string,
  householdSize?: number,
): IncomeBracket {
  if (
    incomeBracket === "0_50k" ||
    incomeBracket === "50k_80k" ||
    incomeBracket === "80k_plus"
  ) {
    return incomeBracket;
  }

  const parsed = Number(incomeBracket.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(parsed)) {
    throw new ApiError(
      "INVALID_INCOME_BRACKET",
      "Income bracket must be a supported bracket or numeric amount",
      400,
    );
  }

  const adjusted = householdSize && householdSize > 1
    ? parsed / householdSize
    : parsed;

  if (adjusted <= 50000) {
    return "0_50k";
  }
  if (adjusted <= 80000) {
    return "50k_80k";
  }
  return "80k_plus";
}

export const assistanceService = {
  normalizeIncomeBracket,

  async qualifyFinancialAssistance(input: {
    hospitalId: string;
    incomeBracket: string;
    householdSize?: number;
    hasInsurance?: boolean | null;
  }): Promise<QualifyFinancialAssistanceResponseDto> {
    const policy = await HospitalPolicyModel.findById(input.hospitalId).lean();
    if (!policy) {
      throw new ApiError("HOSPITAL_NOT_FOUND", "Hospital policy not found", 404);
    }

    const normalizedIncomeBracket = normalizeIncomeBracket(
      input.incomeBracket,
      input.householdSize,
    );

    const matrix = policy.assistanceMatrix.find(
      (entry: { incomeBracket: IncomeBracket }) =>
        entry.incomeBracket === normalizedIncomeBracket,
    );

    if (!matrix) {
      return {
        likelyEligible: false,
        likelyOutcome: "unclear",
        rationale: ["No seeded assistance scenario matched this income input."],
      };
    }

    if (input.hasInsurance === true && matrix.likelyOutcome === "full_waiver") {
      return {
        likelyEligible: matrix.likelyEligible,
        likelyOutcome: "partial_discount",
        rationale: [
          ...matrix.rationale,
          "Insurance on file reduces the demo likelihood of a full waiver.",
        ],
      };
    }

    return {
      likelyEligible: matrix.likelyEligible,
      likelyOutcome: matrix.likelyOutcome,
      rationale: matrix.rationale,
    };
  },

  toAssessment(
    value: QualifyFinancialAssistanceResponseDto | null | undefined,
  ): AssistanceAssessment | null {
    if (!value) {
      return null;
    }

    return {
      likelyEligible: value.likelyEligible,
      likelyOutcome: value.likelyOutcome,
      rationale: value.rationale,
    };
  },
};
