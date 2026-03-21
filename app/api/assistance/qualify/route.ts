import { connectToDatabase } from "@/src/lib/db";
import { fail, ok, parseJson } from "@/src/lib/api";
import { assistanceService } from "@/src/services/assistance.service";
import type { QualifyFinancialAssistanceRequestDto } from "@/src/types/dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await parseJson<QualifyFinancialAssistanceRequestDto>(request);
    const response = await assistanceService.qualifyFinancialAssistance(body);
    return ok(response);
  } catch (error) {
    return fail(error as Error);
  }
}
