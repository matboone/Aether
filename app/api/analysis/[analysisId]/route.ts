import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import { analysisService } from "@/src/services/analysis.service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> },
) {
  try {
    await connectToDatabase();
    const { analysisId } = await params;
    const analysis = await analysisService.getAnalysisById(analysisId);
    return ok(analysis);
  } catch (error) {
    return fail(error as Error);
  }
}
