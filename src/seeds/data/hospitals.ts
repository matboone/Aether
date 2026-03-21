import type { HospitalPolicyDocument } from "@/src/types/domain";

export const hospitalPoliciesSeed: Array<
  Omit<HospitalPolicyDocument, "_id" | "createdAt" | "updatedAt">
> = [
  {
    canonicalName: "TriStar Medical Center",
    aliases: ["tristar", "tristar medical", "tristar medical center"],
    phoneNumber: "615-555-0101",
    billingDepartmentPath: "Billing -> Patient Accounts -> Financial Assistance",
    hasFinancialAssistance: true,
    uninsuredDiscountAvailable: true,
    recommendedSteps: [
      "Request a supervisor review of any large facility fees.",
      "Ask for the self-pay discount before discussing payment options.",
      "If needed, request the charity care screening form on the same call.",
    ],
    negotiationScript: [
      "I have an itemized statement and I would like a billing review for charges above standard pricing.",
      "Please apply any self-pay or uninsured discount available to my account.",
      "If there is a financial assistance screen, I would like to start that process today.",
    ],
    assistanceNotes: [
      "TriStar demo policy favors partial discounts for moderate-income uninsured patients.",
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
  {
    canonicalName: "Vanderbilt",
    aliases: ["vanderbilt", "vanderbilt university medical center", "vumc"],
    phoneNumber: "615-555-0102",
    billingDepartmentPath: "Billing Services -> Customer Service -> Patient Financial Support",
    hasFinancialAssistance: true,
    uninsuredDiscountAvailable: true,
    recommendedSteps: [
      "Lead with a request for pricing review on imaging and emergency charges.",
      "Ask whether the balance qualifies for charity care or prompt-pay relief.",
      "Document the representative name and case number before ending the call.",
    ],
    negotiationScript: [
      "I am calling to review several charges that appear higher than the expected benchmark range.",
      "Can you confirm whether prompt-pay or uninsured relief can be applied?",
      "If financial assistance is available, please tell me the exact next step to submit it.",
    ],
    assistanceNotes: [
      "Vanderbilt demo policy supports both prompt-pay and financial assistance language.",
      "The seeded script emphasizes documentation and escalation.",
    ],
    assistanceMatrix: [
      {
        incomeBracket: "0_50k",
        likelyEligible: true,
        likelyOutcome: "full_waiver",
        rationale: [
          "Lowest income bracket maps to likely charity care eligibility in demo data.",
        ],
      },
      {
        incomeBracket: "50k_80k",
        likelyEligible: true,
        likelyOutcome: "partial_discount",
        rationale: [
          "Moderate income bracket maps to partial discount in demo data.",
        ],
      },
      {
        incomeBracket: "80k_plus",
        likelyEligible: false,
        likelyOutcome: "payment_plan",
        rationale: [
          "Higher income bracket maps to payment plans unless self-pay discounts apply.",
        ],
      },
    ],
  },
  {
    canonicalName: "Ascension",
    aliases: ["ascension", "ascension saint thomas", "saint thomas"],
    phoneNumber: "615-555-0103",
    billingDepartmentPath: "Customer Service -> Billing Support",
    hasFinancialAssistance: true,
    uninsuredDiscountAvailable: true,
    recommendedSteps: [
      "Ask for the uninsured discount immediately if the patient has no active coverage.",
      "Review duplicate or near-duplicate physician charges line by line.",
      "Request a written summary of any payment plan offered.",
    ],
    negotiationScript: [
      "I would like a review of my itemized charges, especially any duplicate professional fees.",
      "Please tell me what uninsured discount or financial assistance options are available.",
      "If a payment plan is the only option, I need the lowest monthly amount documented.",
    ],
    assistanceNotes: [
      "Ascension demo policy biases toward discounts first, payment plans second.",
    ],
    assistanceMatrix: [
      {
        incomeBracket: "0_50k",
        likelyEligible: true,
        likelyOutcome: "full_waiver",
        rationale: [
          "Seeded demo policy treats low-income households as likely eligible.",
        ],
      },
      {
        incomeBracket: "50k_80k",
        likelyEligible: true,
        likelyOutcome: "partial_discount",
        rationale: [
          "Moderate income households remain eligible for a discount review.",
        ],
      },
      {
        incomeBracket: "80k_plus",
        likelyEligible: false,
        likelyOutcome: "payment_plan",
        rationale: [
          "Higher income households are steered toward negotiated payment plans.",
        ],
      },
    ],
  },
  {
    canonicalName: "Generic Hospital Billing Office",
    aliases: ["generic hospital", "unknown hospital", "default"],
    phoneNumber: "800-555-0199",
    billingDepartmentPath: "Billing Office",
    hasFinancialAssistance: false,
    uninsuredDiscountAvailable: false,
    recommendedSteps: [
      "Request an itemized review of the highest charges first.",
      "Ask whether any self-pay discount is available.",
      "Document the call outcome and request written confirmation of any change.",
    ],
    negotiationScript: [
      "I need an itemized billing review for charges that look unusually high.",
      "Please tell me whether any self-pay or hardship reduction is available.",
      "If the balance cannot be reduced, I need the best payment option you can offer.",
    ],
    assistanceNotes: [
      "Fallback strategy is generic and never invents hospital-specific policy.",
    ],
    assistanceMatrix: [
      {
        incomeBracket: "0_50k",
        likelyEligible: false,
        likelyOutcome: "unclear",
        rationale: ["No seeded hospital-specific assistance policy was found."],
      },
      {
        incomeBracket: "50k_80k",
        likelyEligible: false,
        likelyOutcome: "unclear",
        rationale: ["No seeded hospital-specific assistance policy was found."],
      },
      {
        incomeBracket: "80k_plus",
        likelyEligible: false,
        likelyOutcome: "payment_plan",
        rationale: ["Fallback strategy defaults to a payment-plan ask."],
      },
    ],
  },
];
