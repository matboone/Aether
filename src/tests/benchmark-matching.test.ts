import { describe, expect, it } from "bun:test";
import { extractEmbeddedProcedureCode } from "@/src/services/benchmark.service";

describe("extractEmbeddedProcedureCode", () => {
  it("pulls embedded CPT codes from OCR-style labels", () => {
    expect(
      extractEmbeddedProcedureCode(
        "Blood test, lipids (cholesterol and triglycerides) (80061)",
      ),
    ).toBe("80061");

    expect(
      extractEmbeddedProcedureCode(
        "Surgical pathology consultation and report on referred slides prepared elsewhere (88321)",
      ),
    ).toBe("88321");
  });

  it("returns null when no CPT code exists in the label", () => {
    expect(extractEmbeddedProcedureCode("Member discount adjustment")).toBeNull();
  });
});
