import type { DemoBillTemplate } from "@/src/types/domain";

export const demoBillTemplates: DemoBillTemplate[] = [
  {
    key: "tristar-er-demo",
    filenameHints: ["tristar_bill_demo", "tristar_er_statement"],
    textPatterns: ["TriStar Medical Center", "ER Facility Fee", "CT Scan Abdomen"],
    hospitalName: "TriStar Medical Center",
    totalAmount: 4875,
    phoneNumber: "615-555-0101",
    sourceType: "itemized_statement",
    lineItems: [
      { rawLabel: "ER Facility Fee", amount: 2450 },
      { rawLabel: "CT Scan Abdomen", amount: 1850, code: "74176" },
      { rawLabel: "Blood Test", amount: 165, code: "85025" },
      { rawLabel: "IV Fluids", amount: 410, code: "96360" },
    ],
  },
  {
    key: "vanderbilt-imaging-demo",
    filenameHints: ["vanderbilt_bill_demo", "vanderbilt_imaging"],
    textPatterns: ["Vanderbilt", "MRI", "Physician Consult"],
    hospitalName: "Vanderbilt",
    totalAmount: 3660,
    phoneNumber: "615-555-0102",
    sourceType: "itemized_statement",
    lineItems: [
      { rawLabel: "MRI", amount: 2350, code: "70553" },
      { rawLabel: "Physician Consult", amount: 525, code: "99244" },
      { rawLabel: "Lab Panel", amount: 210, code: "80053" },
      { rawLabel: "Medication Administration", amount: 575 },
    ],
  },
  {
    key: "ascension-duplicate-demo",
    filenameHints: ["ascension_bill_demo", "ascension_duplicate"],
    textPatterns: ["Ascension", "Physician Consult", "X-Ray"],
    hospitalName: "Ascension",
    totalAmount: 2285,
    phoneNumber: "615-555-0103",
    sourceType: "itemized_statement",
    lineItems: [
      { rawLabel: "Physician Consult", amount: 495, code: "99244" },
      { rawLabel: "Physician Consult", amount: 510, code: "99244" },
      { rawLabel: "X-Ray", amount: 420, code: "71046" },
      { rawLabel: "ER Facility Fee", amount: 860 },
    ],
  },
];
