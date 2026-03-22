import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { logError, logInfo, summarizeSessionFacts, summarizeText } from "@/src/lib/logger";
import type { RenderableSessionUi, SessionFacts, SessionStep } from "@/src/types/domain";

const FAST_GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";

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
    approvedDraft: string;
  }) {
    try {
      logInfo("llm.service", "llm.request_started", {
        step: input.step,
        facts: summarizeSessionFacts(input.facts),
        approvedDraftPreview: summarizeText(input.approvedDraft),
        latestUserMessagePreview: summarizeText(input.latestUserMessage),
        toolHighlightCount: input.toolHighlights.length,
      });
      const { text } = await generateText({
        model: google(FAST_GEMINI_MODEL),
        prompt: JSON.stringify({
          approvedDraft: input.approvedDraft,
          responseJob:
            "Write the next assistant reply for the user. The backend already decided the workflow and allowed next action. You are only shaping the wording.",
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
            "Keep the meaning and sequence of the approved draft.",
            "Ask only the next allowed question or present only the next allowed step.",
            "Do not add extra workflow steps.",
            "Sound like a calm, capable assistant in a live conversation.",
            "Answer follow-up questions directly before suggesting a next step.",
            "Default to concise replies in 1-3 short sentences unless the user asks for more detail.",
            "Be concise, polished, and helpful.",
          ],
        }),
        system: [
          "You are Aether, the conversational voice of a controlled medical bill demo assistant.",
          "The backend state machine already decided workflow, tools, hospital strategy, and the next allowed action.",
          "Your job is to produce the assistant's actual reply using only the provided data.",
          "Be conversational and natural, but do not change the workflow.",
          "Never diagnose, give legal advice, or invent numeric values.",
          "If the approved draft contains a hospital name or phone number, preserve it exactly.",
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

      const message = text.trim() || input.approvedDraft || fallbackMessages[input.step];
      logInfo("llm.service", "llm.request_completed", {
        step: input.step,
        usedFallbackDraft: !text.trim(),
        assistantPreview: summarizeText(message),
      });
      return message;
    } catch (error) {
      logError("llm.service", "llm.request_failed", error, {
        step: input.step,
        approvedDraftPreview: summarizeText(input.approvedDraft),
      });
      return input.approvedDraft || fallbackMessages[input.step];
    }
  },
};
