import type { SessionFacts, SessionStep, ToolEvent } from "@/src/types/domain";

type LogLevel = "INFO" | "WARN" | "ERROR";

export type RequestLogContext = {
  requestId: string;
  route: string;
  method: string;
  url?: string;
};

function emit(level: LogLevel, scope: string, event: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    event,
    ...(data ? { data } : {}),
  };

  const line = JSON.stringify(entry);
  if (level === "ERROR") {
    console.error(line);
    return;
  }

  console.log(line);
}

function errorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export function createRequestLogContext(
  request: Request | undefined,
  route: string,
): RequestLogContext {
  return {
    requestId: crypto.randomUUID(),
    route,
    method: request?.method ?? "UNKNOWN",
    url: request?.url,
  };
}

export function logInfo(scope: string, event: string, data?: Record<string, unknown>) {
  emit("INFO", scope, event, data);
}

export function logWarn(scope: string, event: string, data?: Record<string, unknown>) {
  emit("WARN", scope, event, data);
}

export function logError(
  scope: string,
  event: string,
  error: unknown,
  data?: Record<string, unknown>,
) {
  emit("ERROR", scope, event, {
    ...data,
    error: errorDetails(error),
  });
}

export function logRouteStart(context: RequestLogContext, data?: Record<string, unknown>) {
  logInfo("route", "request.start", {
    ...context,
    ...data,
  });
}

export function logRouteSuccess(
  context: RequestLogContext,
  status: number,
  data?: Record<string, unknown>,
) {
  logInfo("route", "request.success", {
    ...context,
    status,
    ...data,
  });
}

export function logRouteError(
  context: RequestLogContext,
  error: unknown,
  data?: Record<string, unknown>,
) {
  logError("route", "request.error", error, {
    ...context,
    ...data,
  });
}

export function summarizeText(text: string | null | undefined, max = 120) {
  if (!text) {
    return null;
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

export function summarizeFile(file: File) {
  return {
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
  };
}

export function summarizeSessionFacts(facts: SessionFacts) {
  return {
    hospitalName: facts.hospitalName ?? null,
    hospitalId: facts.hospitalId ?? null,
    hasInsurance: facts.hasInsurance ?? null,
    estimatedBillTotal: facts.estimatedBillTotal ?? null,
    uploadedBillId: facts.uploadedBillId ?? null,
    parsedBillId: facts.parsedBillId ?? null,
    analysisId: facts.analysisId ?? null,
    planId: facts.planId ?? null,
    incomeBracket: facts.incomeBracket ?? null,
    householdSize: facts.householdSize ?? null,
    assistanceEligible: facts.assistanceEligible ?? null,
    negotiationOutcome: facts.negotiationOutcome ?? null,
  };
}

export function summarizeTransition(fromStep: SessionStep, toStep: SessionStep) {
  return { fromStep, toStep };
}

export function summarizeToolEvents(toolEvents: ToolEvent[]) {
  return toolEvents.map((event) => ({
    tool: event.tool,
    status: event.status,
    message: event.message,
  }));
}
