import { afterEach, describe, expect, it, mock } from "bun:test";

afterEach(() => {
  mock.restore();
});

describe("hospitalService.lookupHospitalPolicy", () => {
  it("throws HOSPITAL_NOT_FOUND when no DB policy matches the input name", async () => {
    mock.module("@/src/models/hospital-policy.model", () => ({
      HospitalPolicyModel: {
        find: () => ({
          lean: async () => [
            {
              _id: { toString: () => "tristar-id" },
              canonicalName: "TriStar Medical Center",
              aliases: ["tristar"],
              phoneNumber: "555-000-0000",
              billingDepartmentPath: "Some path",
              hasFinancialAssistance: true,
              uninsuredDiscountAvailable: true,
              recommendedSteps: ["Step 1"],
              negotiationScript: ["Script line"],
              assistanceNotes: ["Note"],
            },
          ],
        }),
      },
    }));

    const { hospitalService } = await import("@/src/services/hospital.service");
    await expect(
      hospitalService.lookupHospitalPolicy({ hospitalName: "Unknown Hospital XYZ" }),
    ).rejects.toMatchObject({ code: "HOSPITAL_NOT_FOUND" });
  });
});
