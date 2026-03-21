import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
} from "@/src/lib/logger";
import { hospitalService } from "@/src/services/hospital.service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string }> },
) {
  const logContext = createRequestLogContext(request, "/api/hospitals/[hospitalId]/strategy");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const { hospitalId } = await params;
    const response = await hospitalService.getStrategyById(hospitalId);
    logRouteSuccess(logContext, 200, {
      hospitalId,
      canonicalName: response.canonicalName,
    });
    return ok(response);
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
