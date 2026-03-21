import { connectToDatabase } from "@/src/lib/db";
import { fail, ok, parseJson } from "@/src/lib/api";
import { planService } from "@/src/services/plan.service";
import type { BuildStrategyRequestDto } from "@/src/types/dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await parseJson<BuildStrategyRequestDto>(request);
    const response = await planService.buildNegotiationPlan(body);
    return ok(response);
  } catch (error) {
    return fail(error as Error);
  }
}
