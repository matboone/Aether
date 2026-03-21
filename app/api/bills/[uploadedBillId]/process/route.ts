import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import { analysisService } from "@/src/services/analysis.service";
import { benchmarkService } from "@/src/services/benchmark.service";
import { hospitalService } from "@/src/services/hospital.service";
import { orchestratorService } from "@/src/services/orchestrator.service";
import { parserService } from "@/src/services/parser.service";
import { sessionService } from "@/src/services/session.service";
import { uploadService } from "@/src/services/upload.service";
import type { ToolEvent } from "@/src/types/domain";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ uploadedBillId: string }> },
) {
  try {
    await connectToDatabase();
    const { uploadedBillId } = await params;
    const upload = await uploadService.getUploadedBill(uploadedBillId);
    const toolEvents: ToolEvent[] = [];

    await uploadService.updateStatus(uploadedBillId, "processing");

    const parsed = await parserService.extractBillDocument({ uploadedBillId });
    toolEvents.push(
      ...parsed.toolEvents,
      {
        tool: "extractBillDocument",
        status: "success",
        message: "Parsed bill document into structured data.",
        data: {
          parsedBillId: parsed.parsedBillId,
          hospitalName: parsed.hospitalName,
          totalAmount: parsed.totalAmount,
          sourceType: parsed.sourceType,
        },
      },
    );

    await sessionService.setStepAndFacts(upload.sessionId.toString(), "BILL_PARSED", {
      parsedBillId: parsed.parsedBillId,
    });

    const classified = await benchmarkService.classifyBillItems({
      parsedBillId: parsed.parsedBillId,
    });
    toolEvents.push({
      tool: "classifyBillItems",
      status: "success",
      message: "Classified bill items against the seeded benchmark taxonomy.",
      data: { normalizedItems: classified.normalizedItems },
    });

    const analysis = await analysisService.analyzeBillPricing({
      parsedBillId: parsed.parsedBillId,
    });
    toolEvents.push({
      tool: "analyzeBillPricing",
      status: "success",
      message: "Completed deterministic bill pricing analysis.",
      data: analysis,
    });

    if (parsed.hospitalName) {
      const policy = await hospitalService.lookupHospitalPolicy({
        hospitalName: parsed.hospitalName,
      });
      toolEvents.push({
        tool: "lookupHospitalPolicy",
        status: "success",
        message: `Loaded hospital strategy for ${policy.canonicalName}.`,
        data: policy,
      });
    }

    const session = await orchestratorService.onBillAnalyzed({
      sessionId: upload.sessionId.toString(),
      parsedBillId: parsed.parsedBillId,
      analysisId: analysis.analysisId,
      hospitalName: parsed.hospitalName,
      estimatedBillTotal: parsed.totalAmount,
    });

    await uploadService.updateStatus(uploadedBillId, "processed");

    const view = await orchestratorService.getSessionView(upload.sessionId.toString());

    return ok({
      sessionId: upload.sessionId.toString(),
      uploadedBillId,
      parsedBillId: parsed.parsedBillId,
      analysisId: analysis.analysisId,
      step: session.step,
      facts: session.facts,
      toolEvents,
      ui: view.ui,
    });
  } catch (error) {
    return fail(error as Error);
  }
}
