export const demoHospital = {
  canonicalName: "Cigna Healthcare",
  aliases: ["cigna", "cigna healthcare"],
  phoneNumber: "615-450-5591",
  billingDepartmentPath: "Billing -> Member Support -> Financial Assistance",
} as const;

export const demoStatement = {
  key: "cigna-itemized-statement",
  filenameBase: "cigna-itemized-statement",
  invoiceNumber: "2001321",
  statementDate: "9/27/2023",
  patientName: "Rhonda Wesley Taylor",
  patientAddressLine1: "628 Providence Lane",
  patientAddressLine2: "Hartsville, TN 37074",
  totalAmount: 862,
  sourceType: "itemized_statement" as const,
  lineItems: [
    {
      rawLabel: "Homovanillic acid (organic acid) level (83150)",
      amount: 67,
      code: "83150",
      quantity: 1,
      unitPrice: 67,
    },
    {
      rawLabel: "Surgical pathology consultation and report on referred slides prepared elsewhere (88321)",
      amount: 545,
      code: "88321",
      quantity: 1,
      unitPrice: 545,
    },
    {
      rawLabel: "Semen evaluation volume, sperm count, motility and analysis (89320)",
      amount: 175,
      code: "89320",
      quantity: 1,
      unitPrice: 175,
    },
    {
      rawLabel: "Blood test, lipids (cholesterol and triglycerides) (80061)",
      amount: 75,
      code: "80061",
      quantity: 1,
      unitPrice: 75,
    },
  ],
} as const;
