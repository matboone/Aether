import { describe, expect, it } from "bun:test";
import {
  buildGuidedAssistantMessage,
  inferInsuranceFromText,
} from "@/src/services/workflow-guidance.service";

describe("inferInsuranceFromText", () => {
  it("understands uninsured contractions and plain language", () => {
    expect(inferInsuranceFromText("No, I don't have insurance.")).toBe(false);
    expect(inferInsuranceFromText("I do not have insurance")).toBe(false);
    expect(inferInsuranceFromText("I am uninsured")).toBe(false);
  });

  it("understands insured responses", () => {
    expect(inferInsuranceFromText("I have insurance")).toBe(true);
    expect(inferInsuranceFromText("Yes, I'm insured")).toBe(true);
  });
});

describe("buildGuidedAssistantMessage", () => {
  it("asks only for insurance when hospital is already known", () => {
    const message = buildGuidedAssistantMessage({
      step: "INTAKE",
      facts: {
        hospitalName: "Cigna Healthcare",
      },
      ui: {
        canUploadBill: false,
        canUploadItemizedStatement: false,
        hospitalStrategy: null,
        negotiationPlan: null,
        resolutionSummary: null,
      },
      latestUserMessage: "Cigna Healthcare",
    });

    expect(message).toContain("Do you have health insurance");
    expect(message).not.toContain("Who is the bill with");
  });

  it("explains itemized statements during the upload stage", () => {
    const message = buildGuidedAssistantMessage({
      step: "AWAITING_BILL_UPLOAD",
      facts: {
        hospitalName: "Cigna Healthcare",
        hasInsurance: false,
      },
      ui: {
        canUploadBill: true,
        canUploadItemizedStatement: true,
        hospitalStrategy: null,
        negotiationPlan: null,
        resolutionSummary: null,
      },
      latestUserMessage: "What is an itemized statement?",
    });

    expect(message).toContain("detailed bill breakdown");
    expect(message).toContain("Upload it when you have it");
  });

  it("offers payment-plan help after a resolution is recorded", () => {
    const message = buildGuidedAssistantMessage({
      step: "RESOLUTION_RECORDED",
      facts: {
        negotiationOutcome: {
          originalAmount: 862,
          reducedAmount: 450,
        },
      },
      ui: {
        canUploadBill: false,
        canUploadItemizedStatement: false,
        hospitalStrategy: null,
        negotiationPlan: null,
        resolutionSummary: null,
      },
      latestUserMessage: "They reduced it to $450.",
    });

    expect(message).toContain("$450");
    expect(message).toContain("payment plan");
  });

  it("returns a payment-plan script when the user asks for follow-up help", () => {
    const message = buildGuidedAssistantMessage({
      step: "COMPLETE",
      facts: {
        negotiationOutcome: {
          originalAmount: 862,
          reducedAmount: 450,
        },
      },
      ui: {
        canUploadBill: false,
        canUploadItemizedStatement: false,
        hospitalStrategy: null,
        negotiationPlan: null,
        resolutionSummary: null,
      },
      latestUserMessage: "Help me negotiate a payment plan for the remaining balance.",
    });

    expect(message).toContain("longest available payment plan");
    expect(message).toContain("no-interest payment plan");
  });
});
