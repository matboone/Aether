import type { HospitalPolicyDocument } from "@/src/types/domain";
import { demoHospital } from "@/src/seeds/data/demo-case";

export const hospitalPoliciesSeed: Array<
  Omit<HospitalPolicyDocument, "_id" | "createdAt" | "updatedAt">
> = [
  {
    canonicalName: demoHospital.canonicalName,
    aliases: [...demoHospital.aliases],
    phoneNumber: demoHospital.phoneNumber,
    billingDepartmentPath: demoHospital.billingDepartmentPath,
    hasFinancialAssistance: true,
    uninsuredDiscountAvailable: true,
    recommendedSteps: [
      "Ask for a review of any specialized laboratory or pathology charges that exceed the expected range.",
      "Request the self-pay discount before discussing payment options.",
      "If needed, request the financial assistance application during the same call.",
    ],
    negotiationScript: [
      "I have an itemized statement and I would like a billing review for charges above the seeded benchmark range.",
      "Please apply any self-pay or uninsured discount available to this account.",
      "If there is a financial assistance screen, I would like to start that process today.",
    ],
    assistanceNotes: [
      "Cigna demo policy favors partial discounts for moderate-income uninsured patients.",
      "Payment plans remain available even when assistance is denied.",
    ],
    assistanceMatrix: [
      {
        incomeBracket: "0_50k",
        likelyEligible: true,
        likelyOutcome: "full_waiver",
        rationale: [
          "Seeded demo policy treats the lowest bracket as strong charity-care candidate.",
        ],
      },
      {
        incomeBracket: "50k_80k",
        likelyEligible: true,
        likelyOutcome: "partial_discount",
        rationale: [
          "Seeded demo policy offers a partial discount for moderate income households.",
        ],
      },
      {
        incomeBracket: "80k_plus",
        likelyEligible: false,
        likelyOutcome: "payment_plan",
        rationale: [
          "Higher income households are routed to self-pay discounts and payment plans.",
        ],
      },
    ],
  },
];
