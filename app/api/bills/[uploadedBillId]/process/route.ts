import { connectToDatabase } from "@/src/lib/db";
import { fail, ok } from "@/src/lib/api";
import {
  createRequestLogContext,
  logRouteError,
  logRouteStart,
  logRouteSuccess,
  summarizeSessionFacts,
  summarizeToolEvents,
} from "@/src/lib/logger";
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
  request: Request,
  { params }: { params: Promise<{ uploadedBillId: string }> },
) {
  const logContext = createRequestLogContext(request, "/api/bills/[uploadedBillId]/process");
  try {
    logRouteStart(logContext);
    await connectToDatabase();
    const { uploadedBillId } = await params;
    logRouteStart(logContext, {
      phase: "resolved_params",
      uploadedBillId,
    });
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

    logRouteSuccess(logContext, 200, {
      sessionId: upload.sessionId.toString(),
      uploadedBillId,
      parsedBillId: parsed.parsedBillId,
      analysisId: analysis.analysisId,
      step: session.step,
      facts: summarizeSessionFacts(session.facts),
      toolEvents: summarizeToolEvents(toolEvents),
    });
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
    logRouteError(logContext, error);
    return fail(error as Error);
  }
}
