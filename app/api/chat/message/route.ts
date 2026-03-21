import { connectToDatabase } from "@/src/lib/db";
import { fail, ok, parseJson } from "@/src/lib/api";
import { orchestratorService } from "@/src/services/orchestrator.service";
import type { ChatMessageRequestDto } from "@/src/types/dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await parseJson<ChatMessageRequestDto>(request);
    const response = await orchestratorService.handleChatMessage(body);
    return ok(response);
  } catch (error) {
    return fail(error as Error);
  }
}
