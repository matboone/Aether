import { connectToDatabase } from "@/src/lib/db";
import { fail, ok, parseJson } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
} from "@/src/lib/logger";
import { assistanceService } from "@/src/services/assistance.service";
import type { QualifyFinancialAssistanceRequestDto } from "@/src/types/dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "/api/assistance/qualify");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const body = await parseJson<QualifyFinancialAssistanceRequestDto>(request);
    const response = await assistanceService.qualifyFinancialAssistance(body);
    logRouteSuccess(logContext, 200, {
      hospitalId: body.hospitalId,
      incomeBracket: body.incomeBracket,
      likelyEligible: response.likelyEligible,
      likelyOutcome: response.likelyOutcome,
    });
    return ok(response);
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
