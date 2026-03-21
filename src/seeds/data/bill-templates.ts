import type { DemoBillTemplate } from "@/src/types/domain";
import { demoHospital, demoStatement } from "@/src/seeds/data/demo-case";

export const demoBillTemplates: DemoBillTemplate[] = [
  {
    key: demoStatement.key,
    filenameHints: [
      demoStatement.filenameBase,
      "cigna_demo_bill",
      "cigna_invoice_demo",
    ],
    textPatterns: [
      demoHospital.canonicalName,
      "Invoice Number",
      "Homovanillic acid",
      "Surgical pathology consultation",
      "Blood test, lipids",
    ],
    hospitalName: demoHospital.canonicalName,
    totalAmount: demoStatement.totalAmount,
    phoneNumber: demoHospital.phoneNumber,
    email: "Cigna@gmail.com",
    sourceType: demoStatement.sourceType,
    lineItems: demoStatement.lineItems.map((item) => ({
      rawLabel: item.rawLabel,
      amount: item.amount,
      ...(item.code ? { code: item.code } : {}),
    })),
  },
];
