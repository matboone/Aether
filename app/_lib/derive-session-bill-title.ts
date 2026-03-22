import type { SessionFacts } from "@/app/_types/dashboard";
import type { RenderableSessionUi } from "@/src/types/domain";

/** Short label for the chat history header — grounded in bill/session facts when available. */
export function deriveSessionBillTitle(input: {
  facts: SessionFacts;
  backendUi: RenderableSessionUi | null;
  uploadFilename: string | null;
  hasStarted: boolean;
}): string {
  const { facts, backendUi, uploadFilename, hasStarted } = input;
  if (!hasStarted) return "New chat";

  const hospital = facts.hospitalName?.trim();
  const total = facts.estimatedBillTotal;
  if (hospital && total) return `${hospital} · ${total}`;
  if (hospital) return hospital;

  const incident = facts.incidentSummary?.trim();
  if (incident) {
    return incident.length > 56 ? `${incident.slice(0, 53)}…` : incident;
  }

  const over = backendUi?.analysisSummary?.estimatedOvercharge;
  if (total && over != null && over > 0) {
    const fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(over);
    return `Bill · ${total} · ~${fmt} overcharge est.`;
  }
  if (total) return `Bill · ${total}`;

  if (uploadFilename) {
    const base = uploadFilename.replace(/\.[^.]+$/, "");
    return base.length > 48 ? `${base.slice(0, 45)}…` : base;
  }

  return "Current session";
}
