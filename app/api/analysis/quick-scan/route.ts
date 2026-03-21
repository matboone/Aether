import { connectToDatabase } from "@/src/lib/db";
import { ApiError, fail, ok } from "@/src/lib/api";
import { analysisService } from "@/src/services/analysis.service";
import { parserService } from "@/src/services/parser.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      throw new ApiError("INVALID_INPUT", "file is required", 400);
    }

    const parsed = await parserService.extractTransientBill(fileValue);
    const analysis = await analysisService.analyzeTransientBill({
      parsedBill: parsed,
    });

    return ok({
      parseResult: parsed,
      analysisSummary: analysis.summary,
      flaggedItems: analysis.flaggedItems,
      allItems: analysis.allItems,
      unmatchedItems: analysis.unmatchedItems,
    });
  } catch (error) {
    return fail(error as Error);
  }
}
