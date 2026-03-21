import { connectToDatabase } from "@/src/lib/db";
import { fail, ok, parseJson } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
} from "@/src/lib/logger";
import { planService } from "@/src/services/plan.service";
import type { BuildStrategyRequestDto } from "@/src/types/dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "/api/strategy/build");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const body = await parseJson<BuildStrategyRequestDto>(request);
    const response = await planService.buildNegotiationPlan(body);
    logRouteSuccess(logContext, 200, {
      analysisId: body.analysisId,
      hospitalId: body.hospitalId,
      planId: response.planId,
      nextActionsCount: response.nextActions.length,
    });
    return ok(response);
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
