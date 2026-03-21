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
          hospitalName: "Cigna Healthcare",
          totalAmount: 862,
          phoneNumber: "615-450-5591",
          sourceType: "itemized_statement",
          lineItems: [
            {
              rawLabel:
                "Surgical pathology consultation and report on referred slides prepared elsewhere (88321)",
              amount: 545,
            },
          ],
        }),
      },
    }));
    mock.module("@/src/services/analysis.service", () => ({
      analysisService: {
        analyzeTransientBill: async () => ({
          summary: {
            originalTotal: 862,
            flaggedCount: 1,
            estimatedOvercharge: 185,
          },
          flaggedItems: [
            {
              label:
                "Surgical pathology consultation and report on referred slides prepared elsewhere (88321)",
              chargedAmount: 545,
              benchmarkAmount: 280,
              fairRangeLow: 180,
              fairRangeHigh: 360,
              severity: "high",
              reason: "above_benchmark",
              suggestedTargetAmount: 360,
            },
          ],
          allItems: [
            {
              label:
                "Surgical pathology consultation and report on referred slides prepared elsewhere (88321)",
              chargedAmount: 545,
              benchmarkAmount: 280,
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
      new File(["Cigna Healthcare\nSurgical pathology consultation (88321) 545"], "cigna_bill_demo.txt", {
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
    expect(body.parseResult.hospitalName).toBe("Cigna Healthcare");
  });
});
