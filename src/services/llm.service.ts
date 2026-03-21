import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { RenderableSessionUi, SessionFacts, SessionStep } from "@/src/types/domain";

const fallbackMessages: Record<SessionStep, string> = {
  NEW: "Tell me the hospital name and whether you have insurance, and I will guide the next step.",
  INTAKE: "I need the hospital name and whether you have insurance before I can move you to the bill review step.",
  AWAITING_BILL_UPLOAD:
    "Please upload the itemized bill or statement so I can review the charges.",
  BILL_UPLOADED: "Your bill upload is saved. I am processing it now.",
  BILL_PARSED: "The bill was parsed successfully. I am running the pricing review now.",
  BILL_ANALYZED:
    "I reviewed the bill. If you can share your income bracket, I can check whether a seeded assistance path applies.",
  AWAITING_INCOME:
    "Please share your income bracket so I can build the assistance and negotiation plan.",
  STRATEGY_READY:
    "I have the flagged charges and negotiation plan ready. Use the next actions and phone script when you call billing.",
  NEGOTIATION_IN_PROGRESS:
    "Tell me what the hospital offered, including any reduced amount or payment plan.",
  RESOLUTION_RECORDED:
    "I recorded the outcome. I can now summarize the savings and final result.",
  COMPLETE:
    "The session is complete. I recorded the final resolution summary.",
  ERROR:
    "Something went wrong in a controlled way. You can restart the session or upload the bill again.",
};

export const llmService = {
  async generateAssistantMessage(input: {
    step: SessionStep;
    facts: SessionFacts;
    ui: RenderableSessionUi;
    latestUserMessage: string;
    toolHighlights: string[];
  }) {
    try {
      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: JSON.stringify({
          currentStep: input.step,
          knownFacts: input.facts,
          analysisSummary: input.ui.analysisSummary ?? null,
          flaggedItems: input.ui.flaggedItems?.slice(0, 3) ?? [],
          hospitalStrategy: input.ui.hospitalStrategy ?? null,
          negotiationPlan: input.ui.negotiationPlan ?? null,
          toolHighlights: input.toolHighlights,
          latestUserMessage: input.latestUserMessage,
          rules: [
            "Do not invent numbers.",
            "Do not invent hospital policies.",
            "Only use data provided in this context.",
            "Ask only the next relevant question allowed by the backend state.",
            "Be concise, polished, and helpful.",
          ],
        }),
        system: [
          "You are the wording layer for a controlled medical bill demo assistant.",
          "You do not decide workflow, tools, or policy.",
          "You only phrase the next allowed question or summarize backend outputs.",
          "Never diagnose, give legal advice, or invent numeric values.",
        ].join(" "),
        providerOptions: {
          google: {
            safetySettings: [
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_ONLY_HIGH",
              },
            ],
          },
        },
      });

      return text.trim() || fallbackMessages[input.step];
    } catch {
      return fallbackMessages[input.step];
    }
  },
};
