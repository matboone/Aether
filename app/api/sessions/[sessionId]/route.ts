import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import { orchestratorService } from "@/src/services/orchestrator.service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    await connectToDatabase();
    const { sessionId } = await params;
    const view = await orchestratorService.getSessionView(sessionId);
    return ok(view);
  } catch (error) {
    return fail(error as Error);
  }
}
