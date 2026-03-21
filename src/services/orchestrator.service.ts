import { Types } from "mongoose";
import { ApiError } from "@/src/lib/api";
import {
  logInfo,
  summarizeSessionFacts,
  summarizeText,
  summarizeToolEvents,
  summarizeTransition,
} from "@/src/lib/logger";
import { BillAnalysisModel } from "@/src/models/bill-analysis.model";
import { NegotiationPlanModel } from "@/src/models/negotiation-plan.model";
import { ResolutionModel } from "@/src/models/resolution.model";
import { SessionModel } from "@/src/models/session.model";
import { hospitalService } from "@/src/services/hospital.service";
import { llmService } from "@/src/services/llm.service";
import { messageService } from "@/src/services/message.service";
import { assistanceService } from "@/src/services/assistance.service";
import { planService } from "@/src/services/plan.service";
import { sessionService } from "@/src/services/session.service";
import {
  buildGuidedAssistantMessage,
  inferInsuranceFromText,
} from "@/src/services/workflow-guidance.service";
import type {
  ChatMessageRequestDto,
  ChatMessageResponseDto,
  RecordResolutionRequestDto,
} from "@/src/types/dto";
import type {
  RenderableSessionUi,
  SessionFacts,
  SessionStep,
  ToolEvent,
} from "@/src/types/domain";

function parseHospitalName(content: string): string | undefined {
  const hospitalMatch = content.match(
    /(cigna healthcare|cigna)/i,
  );
  return hospitalMatch?.[1];
}

function parseInsurance(content: string): boolean | null | undefined {
  return inferInsuranceFromText(content);
}

function parseEstimatedTotal(content: string): number | undefined {
  const amountMatch = content.match(/\$?(\d[\d,]*\.?\d{0,2})/);
  if (!amountMatch) {
    return undefined;
  }
  return Number(amountMatch[1].replace(/,/g, ""));
}

function inferFactPatchFromMessage(
  content: string,
  currentStep: SessionStep,
): Partial<SessionFacts> {
  const patch: Partial<SessionFacts> = {};
  const hospitalName = parseHospitalName(content);
  const hasInsurance = parseInsurance(content);
  const estimatedBillTotal =
    currentStep === "NEW" || currentStep === "INTAKE"
      ? parseEstimatedTotal(content)
      : undefined;

  if (hospitalName) {
    patch.hospitalName = hospitalName;
  }
  if (hasInsurance !== undefined) {
    patch.hasInsurance = hasInsurance;
  }
  if (estimatedBillTotal !== undefined && estimatedBillTotal > 100) {
    patch.estimatedBillTotal = estimatedBillTotal;
  }
  if (content.trim().length > 0 && !patch.incidentSummary) {
    patch.incidentSummary = content.trim();
  }

  return patch;
}

function needsIncome(facts: SessionFacts) {
  return !facts.incomeBracket;
}

function wantsPaymentPlanHelp(content: string) {
  return /\b(payment plan|monthly payment|installments|financ|spread this out)\b/i.test(
    content,
  );
}

function closesCase(content: string) {
  return /\b(case closed|close it|close the case|no thanks|no thank you|all set|done)\b/i.test(
    content,
  );
}

async function buildUi(sessionId: string, sessionStep: SessionStep, facts: SessionFacts): Promise<RenderableSessionUi> {
  const ui: RenderableSessionUi = {
    canUploadBill:
      sessionStep === "AWAITING_BILL_UPLOAD" ||
      sessionStep === "INTAKE" ||
      sessionStep === "ERROR",
    canUploadItemizedStatement:
      sessionStep === "AWAITING_BILL_UPLOAD" || sessionStep === "ERROR",
    hospitalStrategy: null,
    negotiationPlan: null,
    resolutionSummary: null,
  };

  if (facts.analysisId) {
    const analysis = await BillAnalysisModel.findById(facts.analysisId).lean();
    if (analysis) {
      ui.analysisSummary = {
        originalTotal: analysis.originalTotal,
        flaggedCount: analysis.flaggedItems.length,
        estimatedOvercharge: analysis.estimatedOvercharge,
      };
      ui.flaggedItems = analysis.flaggedItems;
    }
  }

  if (facts.hospitalName) {
    ui.hospitalStrategy = await hospitalService.lookupHospitalPolicy({
      hospitalName: facts.hospitalName,
    });
  } else if (facts.hospitalId) {
    const hospitalStrategy = await hospitalService.getStrategyById(facts.hospitalId);
    ui.hospitalStrategy = hospitalStrategy;
  }

  if (facts.planId) {
    const plan = await NegotiationPlanModel.findById(facts.planId).lean();
    if (plan) {
      ui.negotiationPlan = {
        planId: plan._id.toString(),
        nextActions: plan.nextActions,
        phoneScript: plan.phoneScript,
        targetAsk: plan.targetAsk,
        callInstructions: plan.callInstructions,
        assistanceAssessment: plan.assistanceAssessment,
      };
    }
  }

  const resolution = await ResolutionModel.findOne({
    sessionId: new Types.ObjectId(sessionId),
  })
    .sort({ createdAt: -1 })
    .lean();
  if (resolution) {
    const original = resolution.originalAmount;
    const reduced = resolution.reducedAmount;
    ui.resolutionSummary = {
      resolutionType: resolution.resolutionType,
      originalAmount: original,
      reducedAmount: reduced,
      savingsAmount:
        original !== null && reduced !== null ? Math.max(original - reduced, 0) : null,
      notes: resolution.notes,
    };
  }

  return ui;
}

async function ensureHospitalFact(
  facts: SessionFacts,
  toolEvents: ToolEvent[],
): Promise<SessionFacts> {
  if (!facts.hospitalName) {
    return facts;
  }

  const policy = await hospitalService.lookupHospitalPolicy({
    hospitalName: facts.hospitalName,
  });

  toolEvents.push({
    tool: "lookupHospitalPolicy",
    status: "success",
    message: `Matched hospital strategy for ${policy.canonicalName}.`,
    data: policy,
  });

  return {
    ...facts,
    hospitalId: policy.hospitalId,
    hospitalName: policy.canonicalName,
  };
}

async function buildPlanForSession(
  sessionId: string,
  facts: SessionFacts,
  toolEvents: ToolEvent[],
) {
  if (!facts.analysisId || !facts.hospitalId) {
    throw new ApiError(
      "PLAN_PREREQUISITES_MISSING",
      "Analysis and hospital strategy are required before building a plan",
      400,
    );
  }

  let assistanceAssessment = null;
  if (facts.incomeBracket) {
    assistanceAssessment = await assistanceService.qualifyFinancialAssistance({
      hospitalId: facts.hospitalId,
      incomeBracket: facts.incomeBracket,
      householdSize: facts.householdSize ?? undefined,
      hasInsurance: facts.hasInsurance,
    });

    toolEvents.push({
      tool: "qualifyFinancialAssistance",
      status: "success",
      message: "Calculated seeded assistance assessment.",
      data: assistanceAssessment,
    });
  }

  const plan = await planService.buildNegotiationPlan({
    analysisId: facts.analysisId,
    hospitalId: facts.hospitalId,
    assistanceAssessment,
  });

  toolEvents.push({
    tool: "buildNegotiationPlan",
    status: "success",
    message: "Built deterministic negotiation plan.",
    data: plan,
  });

  const updatedFacts: Partial<SessionFacts> = {
    planId: plan.planId,
    assistanceEligible: assistanceAssessment?.likelyEligible ?? null,
  };

  const session = await sessionService.setStepAndFacts(
    sessionId,
    "STRATEGY_READY",
    updatedFacts,
  );

  return session;
}

export const orchestratorService = {
  async handleChatMessage(input: ChatMessageRequestDto): Promise<ChatMessageResponseDto> {
    logInfo("orchestrator.service", "chat.handle_started", {
      sessionId: input.sessionId,
      contentPreview: summarizeText(input.content),
      hasFactPatch: Boolean(input.factPatch),
      hasIncomeInput: Boolean(input.incomeInput),
      hasResolutionInput: Boolean(input.resolutionInput),
    });
    const session = await sessionService.getSessionById(input.sessionId);
    const toolEvents: ToolEvent[] = [];

    await messageService.createMessage({
      sessionId: input.sessionId,
      role: "user",
      content: input.content,
    });

    let facts: SessionFacts = {
      ...session.facts,
      ...inferFactPatchFromMessage(input.content, session.step),
      ...(input.factPatch ?? {}),
    };

    logInfo("orchestrator.service", "chat.facts_inferred", {
      sessionId: input.sessionId,
      previousStep: session.step,
      previousFacts: summarizeSessionFacts(session.facts),
      inferredFacts: summarizeSessionFacts(facts),
    });

    if (input.incomeInput?.householdSize) {
      facts.householdSize = input.incomeInput.householdSize;
    }

    if (input.incomeInput?.incomeBracket) {
      facts.incomeBracket = assistanceService.normalizeIncomeBracket(
        input.incomeInput.incomeBracket,
        input.incomeInput.householdSize ?? facts.householdSize ?? undefined,
      );
    } else if (input.incomeInput?.incomeAmount) {
      facts.incomeBracket = assistanceService.normalizeIncomeBracket(
        String(input.incomeInput.incomeAmount),
        input.incomeInput.householdSize ?? facts.householdSize ?? undefined,
      );
    }

    if (
      input.resolutionInput &&
      (input.resolutionInput.reducedAmount !== undefined ||
        input.resolutionInput.notes ||
        input.resolutionInput.resolutionType)
    ) {
      facts.negotiationOutcome = {
        originalAmount: facts.estimatedBillTotal ?? null,
        reducedAmount: input.resolutionInput.reducedAmount ?? null,
        paymentPlanOffered:
          input.resolutionInput.resolutionType === "payment_plan" ? true : null,
        notes: input.resolutionInput.notes ?? null,
      };
    }

    let currentStep = session.step;

    if (currentStep === "NEW") {
      currentStep = "INTAKE";
      const updated = await sessionService.setStepAndFacts(input.sessionId, currentStep, facts);
      facts = updated.facts;
      logInfo("orchestrator.service", "chat.transition", {
        sessionId: input.sessionId,
        ...summarizeTransition(session.step, currentStep),
        facts: summarizeSessionFacts(facts),
      });
    } else {
      const updated = await sessionService.patchFacts(input.sessionId, facts);
      facts = updated.facts;
      currentStep = updated.step;
    }

    facts = await ensureHospitalFact(facts, toolEvents);
    if (facts.hospitalId || facts.hospitalName !== session.facts.hospitalName) {
      const updated = await sessionService.patchFacts(input.sessionId, facts);
      facts = updated.facts;
      currentStep = updated.step;
    }

    switch (currentStep) {
      case "INTAKE": {
        if (!facts.hospitalName || facts.hasInsurance === undefined || facts.hasInsurance === null) {
          logInfo("orchestrator.service", "chat.intake_blocked", {
            sessionId: input.sessionId,
            missingHospital: !facts.hospitalName,
            missingInsurance:
              facts.hasInsurance === undefined || facts.hasInsurance === null,
          });
          break;
        }

        const updated = await sessionService.setStepAndFacts(
          input.sessionId,
          "AWAITING_BILL_UPLOAD",
          facts,
        );
        facts = updated.facts;
        currentStep = updated.step;
        logInfo("orchestrator.service", "chat.transition", {
          sessionId: input.sessionId,
          ...summarizeTransition("INTAKE", currentStep),
          facts: summarizeSessionFacts(facts),
        });
        break;
      }

      case "BILL_ANALYZED": {
        if (needsIncome(facts)) {
          const updated = await sessionService.setStepAndFacts(
            input.sessionId,
            "AWAITING_INCOME",
            facts,
          );
          facts = updated.facts;
          currentStep = updated.step;
          logInfo("orchestrator.service", "chat.transition", {
            sessionId: input.sessionId,
            ...summarizeTransition("BILL_ANALYZED", currentStep),
            reason: "income_required",
            facts: summarizeSessionFacts(facts),
          });
        } else {
          const updated = await buildPlanForSession(input.sessionId, facts, toolEvents);
          facts = updated.facts;
          currentStep = updated.step;
          logInfo("orchestrator.service", "chat.transition", {
            sessionId: input.sessionId,
            ...summarizeTransition("BILL_ANALYZED", currentStep),
            reason: "plan_built",
            facts: summarizeSessionFacts(facts),
          });
        }
        break;
      }

      case "AWAITING_INCOME": {
        if (facts.incomeBracket) {
          const updated = await buildPlanForSession(input.sessionId, facts, toolEvents);
          facts = updated.facts;
          currentStep = updated.step;
          logInfo("orchestrator.service", "chat.transition", {
            sessionId: input.sessionId,
            ...summarizeTransition("AWAITING_INCOME", currentStep),
            reason: "income_provided",
            facts: summarizeSessionFacts(facts),
          });
        }
        break;
      }

      case "STRATEGY_READY": {
        const reductionMentioned = /\b(reduced|discount|waiver|payment plan|settled)\b/i.test(
          input.content,
        );
        const resolutionInput = input.resolutionInput;

        if (reductionMentioned || resolutionInput?.resolutionType) {
          const updated = await sessionService.updateStep(input.sessionId, "NEGOTIATION_IN_PROGRESS");
          facts = updated.facts;
          currentStep = updated.step;
          logInfo("orchestrator.service", "chat.transition", {
            sessionId: input.sessionId,
            ...summarizeTransition("STRATEGY_READY", currentStep),
            reason: "negotiation_result_detected",
          });
        }

        if (resolutionInput?.resolutionType) {
          await orchestratorService.recordResolution({
            sessionId: input.sessionId,
            reducedAmount: resolutionInput.reducedAmount ?? null,
            resolutionType: resolutionInput.resolutionType,
            notes: resolutionInput.notes ?? null,
          });

          const afterResolution = await sessionService.getSessionById(input.sessionId);
          facts = afterResolution.facts;
          currentStep = afterResolution.step;
          logInfo("orchestrator.service", "chat.resolution_recorded_from_strategy", {
            sessionId: input.sessionId,
            step: currentStep,
            facts: summarizeSessionFacts(facts),
          });
        }
        break;
      }

      case "NEGOTIATION_IN_PROGRESS": {
        const resolutionInput = input.resolutionInput;
        if (resolutionInput?.resolutionType) {
          await orchestratorService.recordResolution({
            sessionId: input.sessionId,
            reducedAmount: resolutionInput.reducedAmount ?? null,
            resolutionType: resolutionInput.resolutionType,
            notes: resolutionInput.notes ?? null,
          });

          const afterResolution = await sessionService.getSessionById(input.sessionId);
          facts = afterResolution.facts;
          currentStep = afterResolution.step;
          logInfo("orchestrator.service", "chat.resolution_recorded", {
            sessionId: input.sessionId,
            step: currentStep,
            facts: summarizeSessionFacts(facts),
          });
        }
        break;
      }

      case "RESOLUTION_RECORDED": {
        const followUpRequested = wantsPaymentPlanHelp(input.content);
        const explicitClose = closesCase(input.content);

        if (followUpRequested || explicitClose) {
          const updated = await sessionService.updateStep(input.sessionId, "COMPLETE");
          facts = updated.facts;
          currentStep = updated.step;
          logInfo("orchestrator.service", "chat.transition", {
            sessionId: input.sessionId,
            ...summarizeTransition("RESOLUTION_RECORDED", currentStep),
            reason: followUpRequested ? "payment_plan_follow_up" : "case_closed",
          });
        }
        break;
      }

      default:
        break;
    }

    const ui = await buildUi(input.sessionId, currentStep, facts);
    const toolHighlights = toolEvents.map((event) => event.message);
    const approvedDraft = buildGuidedAssistantMessage({
      step: currentStep,
      facts,
      ui,
      latestUserMessage: input.content,
    });
    const assistantMessage = await llmService.generateAssistantMessage({
      step: currentStep,
      facts,
      ui,
      latestUserMessage: input.content,
      toolHighlights,
      approvedDraft,
    });

    logInfo("orchestrator.service", "chat.handle_completed", {
      sessionId: input.sessionId,
      step: currentStep,
      facts: summarizeSessionFacts(facts),
      toolEvents: summarizeToolEvents(toolEvents),
      assistantPreview: summarizeText(assistantMessage),
    });

    await messageService.createMessage({
      sessionId: input.sessionId,
      role: "assistant",
      content: assistantMessage,
      toolResults: toolEvents.map((event) => ({
        name: event.tool,
        status: event.status,
        output: event.data ?? { message: event.message },
      })),
    });

    return {
      sessionId: input.sessionId,
      assistantMessage,
      step: currentStep,
      facts,
      toolEvents,
      ui,
    };
  },

  async onBillAnalyzed(input: {
    sessionId: string;
    parsedBillId: string;
    analysisId: string;
    hospitalName: string | null;
    estimatedBillTotal: number | null;
  }) {
    logInfo("orchestrator.service", "bill.analysis_ingested", {
      sessionId: input.sessionId,
      parsedBillId: input.parsedBillId,
      analysisId: input.analysisId,
      hospitalName: input.hospitalName,
      estimatedBillTotal: input.estimatedBillTotal,
    });
    let factsPatch: Partial<SessionFacts> = {
      parsedBillId: input.parsedBillId,
      analysisId: input.analysisId,
      estimatedBillTotal: input.estimatedBillTotal,
    };

    if (input.hospitalName) {
      const hospital = await hospitalService.lookupHospitalPolicy({
        hospitalName: input.hospitalName,
      });
      factsPatch = {
        ...factsPatch,
        hospitalId: hospital.hospitalId,
        hospitalName: hospital.canonicalName,
      };
    }

    const session = await sessionService.setStepAndFacts(
      input.sessionId,
      "BILL_ANALYZED",
      factsPatch,
    );

    logInfo("orchestrator.service", "bill.analysis_session_updated", {
      sessionId: input.sessionId,
      step: session.step,
      facts: summarizeSessionFacts(session.facts),
    });

    return session;
  },

  async recordResolution(input: RecordResolutionRequestDto) {
    logInfo("orchestrator.service", "resolution.record_started", {
      sessionId: input.sessionId,
      reducedAmount: input.reducedAmount ?? null,
      resolutionType: input.resolutionType,
      notesPreview: summarizeText(input.notes ?? null),
    });
    const session = await sessionService.getSessionById(input.sessionId);
    const originalAmount =
      session.facts.negotiationOutcome?.originalAmount ??
      session.facts.estimatedBillTotal ??
      null;

    const resolution = await ResolutionModel.create({
      sessionId: new Types.ObjectId(input.sessionId),
      originalAmount,
      reducedAmount: input.reducedAmount ?? null,
      resolutionType: input.resolutionType,
      notes: input.notes ?? null,
    });

    const updated = await sessionService.setStepAndFacts(
      input.sessionId,
      "RESOLUTION_RECORDED",
      {
        negotiationOutcome: {
          originalAmount,
          reducedAmount: input.reducedAmount ?? null,
          paymentPlanOffered:
            input.resolutionType === "payment_plan" ? true : null,
          notes: input.notes ?? null,
        },
      },
    );

    logInfo("orchestrator.service", "resolution.record_completed", {
      sessionId: input.sessionId,
      resolutionId: resolution._id.toString(),
      step: updated.step,
      facts: summarizeSessionFacts(updated.facts),
    });

    return { resolution, session: updated };
  },

  async getSessionView(sessionId: string) {
    const session = await SessionModel.findById(sessionId).lean();
    if (!session) {
      throw new ApiError("SESSION_NOT_FOUND", "Session not found", 404);
    }

    logInfo("orchestrator.service", "session.view_loaded", {
      sessionId,
      step: session.step,
      facts: summarizeSessionFacts(session.facts),
    });

    return {
      sessionId: session._id.toString(),
      step: session.step,
      facts: session.facts,
      ui: await buildUi(sessionId, session.step, session.facts),
      analysisId: session.facts.analysisId,
      hospitalId: session.facts.hospitalId,
      planId: session.facts.planId ?? undefined,
    };
  },
};
