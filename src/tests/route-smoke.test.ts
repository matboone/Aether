import { afterEach, describe, expect, it, mock } from "bun:test";

afterEach(() => {
  mock.restore();
});

describe("route smoke tests", () => {
  it("creates a session response shape", async () => {
    mock.module("@/src/lib/db", () => ({
      connectToDatabase: async () => undefined,
    }));
    mock.module("@/src/services/session.service", () => ({
      sessionService: {
        createSession: async () => ({
          _id: { toString: () => "507f1f77bcf86cd799439011" },
        }),
      },
    }));
    mock.module("@/src/services/orchestrator.service", () => ({
      orchestratorService: {
        getSessionView: async () => ({
          sessionId: "507f1f77bcf86cd799439011",
          step: "NEW",
          facts: {},
          ui: {
            canUploadBill: false,
            canUploadItemizedStatement: false,
          },
        }),
      },
    }));

    const route = await import("@/app/api/sessions/route");
    const response = await route.POST();
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.sessionId).toBe("507f1f77bcf86cd799439011");
    expect(body.step).toBe("NEW");
  });

  it("runs quick scan without persistence", async () => {
    mock.module("@/src/lib/db", () => ({
      connectToDatabase: async () => undefined,
    }));
    mock.module("@/src/services/parser.service", () => ({
      parserService: {
        extractTransientBill: async () => ({
          hospitalName: "TriStar Medical Center",
          totalAmount: 4875,
          phoneNumber: "615-555-0101",
          sourceType: "itemized_statement",
          lineItems: [{ rawLabel: "ER Facility Fee", amount: 2450 }],
        }),
      },
    }));
    mock.module("@/src/services/analysis.service", () => ({
      analysisService: {
        analyzeTransientBill: async () => ({
          summary: {
            originalTotal: 4875,
            flaggedCount: 1,
            estimatedOvercharge: 1200,
          },
          flaggedItems: [
            {
              label: "ER Facility Fee",
              chargedAmount: 2450,
              benchmarkAmount: 950,
              fairRangeLow: 700,
              fairRangeHigh: 1250,
              severity: "high",
              reason: "above_benchmark",
              suggestedTargetAmount: 1250,
            },
          ],
          allItems: [
            {
              label: "ER Facility Fee",
              chargedAmount: 2450,
              benchmarkAmount: 950,
              matched: true,
            },
          ],
          unmatchedItems: [],
        }),
      },
    }));

    const route = await import("@/app/api/analysis/quick-scan/route");
    const formData = new FormData();
    formData.set(
      "file",
      new File(["TriStar Medical Center\nER Facility Fee 2450"], "tristar_bill_demo.txt", {
        type: "text/plain",
      }),
    );

    const response = await route.POST(
      new Request("http://localhost/api/analysis/quick-scan", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysisSummary.flaggedCount).toBe(1);
    expect(body.parseResult.hospitalName).toBe("TriStar Medical Center");
  });
});
