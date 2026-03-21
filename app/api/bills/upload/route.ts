import { connectToDatabase } from "@/src/lib/db";
import { ApiError, fail, ok } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
  summarizeFile,
} from "@/src/lib/logger";
import { sessionService } from "@/src/services/session.service";
import { uploadService } from "@/src/services/upload.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "/api/bills/upload");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const formData = await request.formData();
    const sessionIdValue = formData.get("sessionId");
    const fileValue = formData.get("file");

    if (typeof sessionIdValue !== "string") {
      throw new ApiError("INVALID_INPUT", "sessionId is required", 400);
    }

    if (!(fileValue instanceof File)) {
      throw new ApiError("INVALID_INPUT", "file is required", 400);
    }

    logRouteStart(logContext, {
      phase: "validated_input",
      sessionId: sessionIdValue,
      file: summarizeFile(fileValue),
    });
    const upload = await uploadService.createUploadedBill(sessionIdValue, fileValue);
    await sessionService.setStepAndFacts(sessionIdValue, "BILL_UPLOADED", {
      uploadedBillId: upload._id.toString(),
    });

    logRouteSuccess(logContext, 201, {
      sessionId: sessionIdValue,
      uploadedBillId: upload._id.toString(),
      status: upload.status,
    });
    return ok(
      {
        uploadedBillId: upload._id.toString(),
        sessionId: sessionIdValue,
        filename: upload.filename,
        status: upload.status,
      },
      201,
    );
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
