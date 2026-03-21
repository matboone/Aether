import { HospitalPolicyModel } from "@/src/models/hospital-policy.model";
import { normalizeText } from "@/src/lib/normalize";
import { ApiError } from "@/src/lib/api";
import type { LookupHospitalPolicyOutputDto } from "@/src/types/dto";

function toPolicyDto(policy: {
  _id: { toString(): string };
  canonicalName: string;
  phoneNumber: string | null;
  billingDepartmentPath: string | null;
  hasFinancialAssistance: boolean;
  uninsuredDiscountAvailable: boolean;
  recommendedSteps: string[];
  negotiationScript: string[];
  assistanceNotes: string[];
}): LookupHospitalPolicyOutputDto {
  return {
    hospitalId: policy._id.toString(),
    canonicalName: policy.canonicalName,
    phoneNumber: policy.phoneNumber,
    billingDepartmentPath: policy.billingDepartmentPath,
    hasFinancialAssistance: policy.hasFinancialAssistance,
    uninsuredDiscountAvailable: policy.uninsuredDiscountAvailable,
    recommendedSteps: policy.recommendedSteps,
    negotiationScript: policy.negotiationScript,
    assistanceNotes: policy.assistanceNotes,
  };
}

export const hospitalService = {
  async lookupHospitalPolicy(input: { hospitalName: string }) {
    const rawName = input.hospitalName.trim();
    const normalized = normalizeText(rawName);

    const allPolicies = await HospitalPolicyModel.find().lean();
    const fallback =
      allPolicies.find(
        (policy) => policy.canonicalName === "Generic Hospital Billing Office",
      ) ?? allPolicies[0];

    const exactCanonical = allPolicies.find(
      (policy) => normalizeText(policy.canonicalName) === normalized,
    );
    if (exactCanonical) {
      return toPolicyDto(exactCanonical);
    }

    const aliasMatch = allPolicies.find((policy) =>
      policy.aliases.some((alias: string) => normalizeText(alias) === normalized),
    );
    if (aliasMatch) {
      return toPolicyDto(aliasMatch);
    }

    const containsMatch = allPolicies.find((policy) => {
      const canonical = normalizeText(policy.canonicalName);
      return canonical.includes(normalized) || normalized.includes(canonical);
    });

    return toPolicyDto(containsMatch ?? fallback);
  },

  async getStrategyById(hospitalId: string) {
    const policy = await HospitalPolicyModel.findById(hospitalId).lean();
    if (!policy) {
      throw new ApiError("HOSPITAL_NOT_FOUND", "Hospital strategy not found", 404);
    }
    return toPolicyDto(policy);
  },
};
