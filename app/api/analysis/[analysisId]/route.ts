import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
} from "@/src/lib/logger";
import { analysisService } from "@/src/services/analysis.service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ analysisId: string }> },
) {
  const logContext = createRequestLogContext(request, "/api/analysis/[analysisId]");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const { analysisId } = await params;
    const analysis = await analysisService.getAnalysisById(analysisId);
    logRouteSuccess(logContext, 200, {
      analysisId,
      flaggedCount: analysis.flaggedItems.length,
      originalTotal: analysis.originalTotal,
      estimatedOvercharge: analysis.estimatedOvercharge,
    });
    return ok(analysis);
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
