import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
} from "@/src/lib/logger";
import { orchestratorService } from "@/src/services/orchestrator.service";
import { sessionService } from "@/src/services/session.service";

export const runtime = "nodejs";

export async function POST(request?: Request) {
  const logContext = createRequestLogContext(request, "/api/sessions");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const session = await sessionService.createSession();
    const view = await orchestratorService.getSessionView(session._id.toString());
    logRouteSuccess(logContext, 201, {
      sessionId: view.sessionId,
      step: view.step,
    });
    return ok(view, 201);
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
