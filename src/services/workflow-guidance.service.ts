import type {
  RenderableSessionUi,
  SessionFacts,
  SessionStep,
} from "@/src/types/domain";

function formatMoney(value?: number | null) {
  if (typeof value !== "number") {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function inferInsuranceFromText(content: string): boolean | undefined {
  if (
    /\b(no insurance|uninsured|without insurance|don['’]?t have insurance|do not have insurance|i have no insurance)\b/i.test(
      content,
    )
  ) {
    return false;
  }

  if (
    /\b(i have insurance|i'm insured|insured|with insurance|my insurance)\b/i.test(
      content,
    )
  ) {
    return true;
  }

  return undefined;
}

export function buildGuidedAssistantMessage(input: {
  step: SessionStep;
  facts: SessionFacts;
  ui: RenderableSessionUi;
  latestUserMessage: string;
}) {
  const latestMessage = input.latestUserMessage.trim();
  const lowerMessage = latestMessage.toLowerCase();
  const hospitalName = input.facts.hospitalName ?? "the hospital";
  const hospitalPhone = input.ui.hospitalStrategy?.phoneNumber ?? "the billing number on the statement";

  if (input.step === "INTAKE") {
    if (!input.facts.hospitalName) {
      return "I can help with that. Who is the bill with?";
    }

    if (input.facts.hasInsurance === null || input.facts.hasInsurance === undefined) {
      return `Thanks. I have the bill with ${hospitalName}. Do you have health insurance, or are you uninsured?`;
    }
  }

  if (input.step === "AWAITING_BILL_UPLOAD") {
    if (
      /what is an itemized statement|what's an itemized statement|explain itemized/i.test(
        latestMessage,
      )
    ) {
      return "An itemized statement is the detailed bill breakdown from the hospital. It lists each charge line by line so we can spot overcharges and use them during negotiation. Upload it when you have it.";
    }

    if (/requested|called the hospital|asked for it/i.test(lowerMessage)) {
      return `Perfect. Since I already have your provider and coverage context, the next step is the PDF itemized statement upload. Once you attach it, I’ll review the charges, compare them to benchmark data, and prepare your negotiation plan.`;
    }

    return `I have enough context to move forward. When you’re ready, attach the PDF itemized statement and I’ll start the bill review immediately.`;
  }

  if (input.step === "BILL_ANALYZED" || input.step === "AWAITING_INCOME") {
    return "I finished the analysis. Review the Bill Summary and Flagged Line Items modules, then choose your income bracket so I can build the assistance path and call plan.";
  }

  if (input.step === "STRATEGY_READY") {
    const likelyWaiver =
      input.ui.negotiationPlan?.assistanceAssessment?.likelyOutcome === "full_waiver";
    const firstInstruction = input.ui.negotiationPlan?.callInstructions?.[0];

    return likelyWaiver
      ? `Based on this bracket, the assistance path looks strong and may support a full waiver. Call ${hospitalPhone}, ask for billing, and request both an itemized review and the financial assistance screen. ${firstInstruction ?? "Tell me what they offer once you call."}`
      : `Your negotiation plan is ready. Call ${hospitalPhone}, raise the flagged charges, ask for the self-pay discount, and request the best billing resolution available. ${firstInstruction ?? "Tell me what they offer once you call."}`;
  }

  if (input.step === "NEGOTIATION_IN_PROGRESS") {
    return "Tell me exactly what the billing team offered, including any reduced amount or payment plan, and I will record the outcome.";
  }

  if (input.step === "RESOLUTION_RECORDED" || input.step === "COMPLETE") {
    const wantsPaymentPlan =
      /\b(payment plan|monthly payment|installments|financ|spread this out)\b/i.test(
        lowerMessage,
      );
    const closesCase =
      /\b(case closed|close it|close the case|no thanks|no thank you|all set|done)\b/i.test(
        lowerMessage,
      );
    const reducedAmount = formatMoney(input.facts.negotiationOutcome?.reducedAmount);
    const originalAmount = formatMoney(input.facts.negotiationOutcome?.originalAmount);

    if (input.step === "RESOLUTION_RECORDED") {
      if (reducedAmount) {
        return `I recorded the outcome. The balance moved from ${originalAmount ?? "the original amount"} to ${reducedAmount}. If you want, I can help you ask for a payment plan on the remaining balance.`;
      }

      return "I recorded the result. If you want, I can help you ask for a payment plan on the remaining balance.";
    }

    if (wantsPaymentPlan) {
      return `Ask the billing team to place the remaining balance on the longest available payment plan with the lowest monthly amount and no added interest or fees. You can say: "The reduced balance is still difficult for me to pay at once. What is the longest no-interest payment plan you can offer on this account?"`;
    }

    if (closesCase) {
      return reducedAmount
        ? `Understood. I recorded the reduced balance at ${reducedAmount}. This case is closed and ready for replay when you want another demo.`
        : "Understood. I recorded the outcome and closed the case. Start a new session whenever you want to replay the demo.";
    }

    if (reducedAmount) {
      return `I recorded the outcome. The balance moved from ${originalAmount ?? "the original amount"} to ${reducedAmount}. If that still feels heavy, your next safe ask is the longest available payment plan with the lowest monthly amount.`;
    }

    return "I recorded the result. If the balance was not reduced, the next safe ask is a structured payment plan with the longest term available.";
  }

  if (input.step === "ERROR") {
    return "Something failed in the controlled demo flow. Restart the session and upload the itemized statement again.";
  }

  return "Tell me what happened with the bill, and I will guide the next approved step.";
}
