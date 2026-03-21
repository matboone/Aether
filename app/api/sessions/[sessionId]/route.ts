import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
  summarizeSessionFacts,
} from "@/src/lib/logger";
import { orchestratorService } from "@/src/services/orchestrator.service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const logContext = createRequestLogContext(request, "/api/sessions/[sessionId]");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const { sessionId } = await params;
    const view = await orchestratorService.getSessionView(sessionId);
    logRouteSuccess(logContext, 200, {
      sessionId,
      step: view.step,
      facts: summarizeSessionFacts(view.facts),
    });
    return ok(view);
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
