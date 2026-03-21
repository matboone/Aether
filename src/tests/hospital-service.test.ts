import { afterEach, describe, expect, it, mock } from "bun:test";

afterEach(() => {
  mock.restore();
});

describe("hospitalService.lookupHospitalPolicy", () => {
  it("falls back to the seeded Cigna policy instead of stale database data", async () => {
    mock.module("@/src/models/hospital-policy.model", () => ({
      HospitalPolicyModel: {
        find: () => ({
          lean: async () => [
            {
              _id: { toString: () => "stale-tristar-id" },
              canonicalName: "TriStar Medical Center",
              aliases: ["tristar"],
              phoneNumber: "555-000-0000",
              billingDepartmentPath: "Old path",
              hasFinancialAssistance: true,
              uninsuredDiscountAvailable: true,
              recommendedSteps: ["Old step"],
              negotiationScript: ["Old script"],
              assistanceNotes: ["Old note"],
            },
          ],
        }),
      },
    }));

    const { hospitalService } = await import("@/src/services/hospital.service");
    const policy = await hospitalService.lookupHospitalPolicy({
      hospitalName: "Cigna Healthcare",
    });

    expect(policy.canonicalName).toBe("Cigna Healthcare");
    expect(policy.phoneNumber).toBe("615-450-5591");
    expect(policy.hospitalId).toBe("seeded-cigna-healthcare");
  });
});
