import { connectToDatabase } from "@/src/lib/db";
import { fail, ok, parseJson } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
  summarizeSessionFacts,
} from "@/src/lib/logger";
import { orchestratorService } from "@/src/services/orchestrator.service";
import type { RecordResolutionRequestDto } from "@/src/types/dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "/api/resolutions");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const body = await parseJson<RecordResolutionRequestDto>(request);
    const { resolution, session } = await orchestratorService.recordResolution(body);
    const view = await orchestratorService.getSessionView(body.sessionId);
    logRouteSuccess(logContext, 200, {
      sessionId: body.sessionId,
      resolutionId: resolution._id.toString(),
      step: session.step,
      facts: summarizeSessionFacts(session.facts),
    });
    return ok({
      resolutionRecorded: true,
      sessionId: body.sessionId,
      resolutionId: resolution._id.toString(),
      step: session.step,
      facts: session.facts,
      ui: view.ui,
    });
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
