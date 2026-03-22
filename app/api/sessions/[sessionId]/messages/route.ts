import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
} from "@/src/lib/logger";
import { messageService } from "@/src/services/message.service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const logContext = createRequestLogContext(request, "/api/sessions/[sessionId]/messages");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const { sessionId } = await params;
    const rows = await messageService.listMessages(sessionId);
    const messages = rows.map((m) => ({
      id: m._id.toString(),
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
      createdAt: m.createdAt,
    }));
    logRouteSuccess(logContext, 200, { sessionId, count: messages.length });
    return ok({ sessionId, messages });
  } catch (error) {
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
