import { connectToDatabase } from "@/src/lib/db";
import { ApiError, fail, ok } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
  summarizeFile,
} from "@/src/lib/logger";
import { analysisService } from "@/src/services/analysis.service";
import { parserService } from "@/src/services/parser.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "/api/analysis/quick-scan");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      throw new ApiError("INVALID_INPUT", "file is required", 400);
    }

    logRouteStart(logContext, {
      phase: "validated_input",
      file: summarizeFile(fileValue),
    });
    const parsed = await parserService.extractTransientBill(fileValue);
    const analysis = await analysisService.analyzeTransientBill({
      parsedBill: parsed,
    });

    logRouteSuccess(logContext, 200, {
      hospitalName: parsed.hospitalName,
      totalAmount: parsed.totalAmount,
      flaggedCount: analysis.summary.flaggedCount,
      estimatedOvercharge: analysis.summary.estimatedOvercharge,
    });
    return ok({
      parseResult: parsed,
      analysisSummary: analysis.summary,
      flaggedItems: analysis.flaggedItems,
      allItems: analysis.allItems,
      unmatchedItems: analysis.unmatchedItems,
    });
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
