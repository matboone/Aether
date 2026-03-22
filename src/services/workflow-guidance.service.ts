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
      if (
        /walk me through|step by step|how does this work|explain how|what information|need first|process work/i.test(
          lowerMessage,
        )
      ) {
        return "Here’s the flow: I’ll capture who billed you and whether you have insurance, then you’ll upload an itemized bill. I compare charges to benchmarks, you pick a household income bracket for assistance rules, and I give you a negotiation checklist and call script. Who is this bill from: the hospital or payer name?";
      }
      return "I can help with that. Who is the bill with?";
    }

    if (input.facts.hasInsurance === null || input.facts.hasInsurance === undefined) {
      if (/how does.*insurance|change the strategy|uninsured|underinsured/i.test(lowerMessage)) {
        return `Insurance changes what you emphasize on the call. Covered patients often fight EOB issues; uninsured or underinsured leans harder on assistance and self-pay discounts. First, are you insured for this visit, or uninsured?`;
      }
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

  if (input.step === "BILL_ANALYZED") {
    const flaggedCount =
      input.ui.analysisSummary?.flaggedCount ?? input.ui.flaggedItems?.length ?? 0;
    const over = formatMoney(input.ui.analysisSummary?.estimatedOvercharge);
    const total = formatMoney(input.ui.analysisSummary?.originalTotal);

    if (/flagged|explain.*charg|what.*charg|line item|breakdown/i.test(latestMessage)) {
      return flaggedCount > 0
        ? `I flagged ${flaggedCount} line item${flaggedCount === 1 ? "" : "s"} that look high versus fair benchmarks. Open the Flagged Line Items module for each charge and reason${over ? ` (rough exposure above benchmark: about ${over})` : ""}. When you’re ready, pick your income bracket so I can run the assistance match.`
        : "Use the Bill Summary for totals; any standout charges will appear under Flagged Line Items. Then choose your income bracket so I can tie in financial assistance rules.";
    }
    if (/saving|saved|estimated|overcharge|money back|how much can/i.test(lowerMessage)) {
      return over
        ? `I’m estimating about ${over} in charges that may sit above typical benchmarks${total ? ` on a ${total} statement` : ""}. What you actually save depends on billing. Those flagged lines are your leverage. Add your income bracket next so charity-care options show up too.`
        : "Savings depend on what billing agrees to adjust. Start from the flagged charges in the module, then share your income bracket for assistance screening.";
    }
    if (/first|what should i do|where do i start|next step|walk me|step by step/i.test(lowerMessage)) {
      return "Skim Bill Summary for totals, then Flagged Line Items for what to dispute. After that, choose your household income bracket and confirm. That’s what unlocks eligibility and your call plan.";
    }
    if (
      /why.*income|income bracket|need.*income|privacy|comfortable.*sharing|exact income|eligib/i.test(
        lowerMessage,
      )
    ) {
      return "I only use a broad income bracket to map you to the hospital’s financial assistance tiers, not exact salary. Pick the range that fits your household; you can use “Prefer not to say” and I’ll still give a conservative playbook.";
    }
    return "I finished the analysis. Review the Bill Summary and Flagged Line Items modules, then choose your income bracket so I can build the assistance path and call plan.";
  }

  if (input.step === "AWAITING_INCOME") {
    if (
      /why.*need|why do you need|need my income|need.*bracket|privacy|comfortable|not comfortable|exact income/i.test(
        lowerMessage,
      )
    ) {
      return "Charity care and discounts are tiered by household income vs federal poverty guidelines. I only need a coarse bracket to pick the right policy path, not paystubs. If you’d rather not say, choose “Prefer not to say” and I’ll bias the plan toward disputing flagged charges and standard discounts.";
    }
    if (/how will income|affect.*eligib|eligib.*result|change.*outcome|income affect/i.test(lowerMessage)) {
      return `Lower brackets usually open stronger assistance at ${hospitalName}; higher brackets still get self-pay discounts and payment-plan levers. Once you confirm a bracket, I’ll show the eligibility readout and script tied to this bill.`;
    }
    if (/prefer not|don.?t want to share|not share|uncomfortable/i.test(lowerMessage)) {
      return "Use “Prefer not to say.” I’ll assume a higher-income path, focus the plan on flagged charges and standard billing discounts, and you’ll still get a ready-to-use call script.";
    }
    if (/walk me through|explain how|how does this work|information.*need/i.test(lowerMessage)) {
      return "Pick household size, tap the income range that fits, then Confirm Selection. That saves your bracket, runs the seeded assistance check, and loads your negotiation steps and phone script.";
    }
    return "Review the flagged charges if you haven’t yet, then choose household size and income range in the module and tap Confirm Selection. That runs eligibility and builds your call plan.";
  }

  if (input.step === "STRATEGY_READY") {
    const likelyWaiver =
      input.ui.negotiationPlan?.assistanceAssessment?.likelyOutcome === "full_waiver";
    const firstInstruction = input.ui.negotiationPlan?.callInstructions?.[0];
    const assessment = input.ui.negotiationPlan?.assistanceAssessment;
    const likelyEligible = assessment?.likelyEligible;
    const outcome = assessment?.likelyOutcome?.replaceAll("_", " ") ?? null;
    const rationale0 = assessment?.rationale?.[0];

    if (/am i .*eligible|likely eligible|eligibility|do i qualify/i.test(lowerMessage)) {
      if (likelyEligible === true) {
        return `Based on your bracket and ${hospitalName}’s seeded policy, you’re flagged as likely eligible for assistance (${outcome ?? "review needed"}). ${rationale0 ?? "Use the Eligibility module for detail, then follow the Action Plan before you call."}`;
      }
      if (likelyEligible === false) {
        return `With this bracket, the demo policy leans less likely for full charity care (${outcome ?? "partial options may still exist"}). ${rationale0 ?? "You can still press the flagged charges and ask for self-pay discounts; see the Action Plan."}`;
      }
      return "Open the Eligibility card in the thread for the full readout. If anything looks off, tell me your bracket again or ask about a specific program name on your statement.";
    }
    if (/what documents|paperwork|proof|need to bring/i.test(lowerMessage)) {
      return "Typical asks are pay stubs, tax return, or a short financial aid form. Exact lists vary by hospital. Mention you’re applying for financial assistance when you call; they’ll tell you what to upload or mail.";
    }
    if (/what should i ask|ask billing|say to billing|first ask/i.test(lowerMessage)) {
      return firstInstruction
        ? `Lead with this: ${firstInstruction} Then reference the flagged line items by name and amount. The full script is in your Phone Script module.`
        : `Call ${hospitalPhone}, identify your account, ask for billing or financial counseling, and request review of the flagged charges plus any assistance screening.`;
    }
    if (/summarize.*strategy|strategy checklist|checklist/i.test(lowerMessage)) {
      const actions = input.ui.negotiationPlan?.nextActions?.slice(0, 4) ?? [];
      const bullets =
        actions.length > 0
          ? ` Key steps: ${actions.map((a, i) => `${i + 1}) ${a}`).join(" ")}`
          : "";
      return `You’re in the strategy phase: dispute overcharges, request assistance if eligible, and lock a payment plan if needed.${bullets} Expand the Action Plan module for the full ordered list.`;
    }
    if (/dispute summary|draft.*letter|short summary/i.test(lowerMessage)) {
      return `Short version for billing: “I’m calling about account [number]. I reviewed the itemized bill and have questions on specific line items that look above usual benchmarks. I’d like a financial assistance review and a written summary of any adjustments.” Tailor with amounts from Flagged Line Items.`;
    }

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
