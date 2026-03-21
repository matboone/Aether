import { connectToDatabase } from "@/src/lib/db";
import { fail, ok, parseJson } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
  summarizeSessionFacts,
  summarizeText,
  summarizeToolEvents,
} from "@/src/lib/logger";
import { orchestratorService } from "@/src/services/orchestrator.service";
import type { ChatMessageRequestDto } from "@/src/types/dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "/api/chat/message");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const body = await parseJson<ChatMessageRequestDto>(request);
    logRouteStart(logContext, {
      phase: "parsed_body",
      sessionId: body.sessionId,
      contentPreview: summarizeText(body.content),
      hasFactPatch: Boolean(body.factPatch),
      hasIncomeInput: Boolean(body.incomeInput),
      hasResolutionInput: Boolean(body.resolutionInput),
    });
    const response = await orchestratorService.handleChatMessage(body);
    logRouteSuccess(logContext, 200, {
      sessionId: response.sessionId,
      step: response.step,
      facts: summarizeSessionFacts(response.facts),
      toolEvents: summarizeToolEvents(response.toolEvents),
      assistantPreview: summarizeText(response.assistantMessage),
    });
    return ok(response);
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
