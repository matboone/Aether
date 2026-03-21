import { connectToDatabase } from "@/src/lib/db";
import { ApiError, fail, ok } from "@/src/lib/api";
import { sessionService } from "@/src/services/session.service";
import { uploadService } from "@/src/services/upload.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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

    const upload = await uploadService.createUploadedBill(sessionIdValue, fileValue);
    await sessionService.setStepAndFacts(sessionIdValue, "BILL_UPLOADED", {
      uploadedBillId: upload._id.toString(),
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
    return fail(error as Error);
  }
}
