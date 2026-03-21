import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import { hospitalService } from "@/src/services/hospital.service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hospitalId: string }> },
) {
  try {
    await connectToDatabase();
    const { hospitalId } = await params;
    const response = await hospitalService.getStrategyById(hospitalId);
    return ok(response);
  } catch (error) {
    return fail(error as Error);
  }
}
