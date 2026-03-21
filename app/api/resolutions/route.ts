import { connectToDatabase } from "@/src/lib/db";
import { fail, ok, parseJson } from "@/src/lib/api";
import { orchestratorService } from "@/src/services/orchestrator.service";
import type { RecordResolutionRequestDto } from "@/src/types/dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await parseJson<RecordResolutionRequestDto>(request);
    const { resolution, session } = await orchestratorService.recordResolution(body);
    const view = await orchestratorService.getSessionView(body.sessionId);
    return ok({
      resolutionRecorded: true,
      sessionId: body.sessionId,
      resolutionId: resolution._id.toString(),
      step: session.step,
      facts: session.facts,
      ui: view.ui,
    });
  } catch (error) {
    return fail(error as Error);
  }
}
