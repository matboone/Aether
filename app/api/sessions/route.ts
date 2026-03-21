import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import { orchestratorService } from "@/src/services/orchestrator.service";
import { sessionService } from "@/src/services/session.service";

export const runtime = "nodejs";

export async function POST() {
  try {
    await connectToDatabase();
    const session = await sessionService.createSession();
    const view = await orchestratorService.getSessionView(session._id.toString());
    return ok(view, 201);
  } catch (error) {
    return fail(error as Error);
  }
}
