import { describe, expect, it } from "bun:test";
import { extractEmbeddedProcedureCode } from "@/src/services/benchmark.service";

describe("extractEmbeddedProcedureCode", () => {
  it("pulls embedded CPT codes from OCR-style labels with parentheses", () => {
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

  it("pulls CPT codes preceded by CPT or HCPCS prefix", () => {
    expect(extractEmbeddedProcedureCode("CPT 99213 Office visit")).toBe(
      "99213",
    );
    expect(extractEmbeddedProcedureCode("CPT: 99213")).toBe("99213");
    expect(extractEmbeddedProcedureCode("HCPCS 99213")).toBe("99213");
    expect(extractEmbeddedProcedureCode("hcpcs 99213")).toBe("99213");
    expect(extractEmbeddedProcedureCode("CPT#99213")).toBe("99213");
  });

  it("does not treat unrelated 5-digit numbers as CPT codes", () => {
    expect(
      extractEmbeddedProcedureCode("Patient at 90210 ZIP code"),
    ).toBeNull();
    expect(
      extractEmbeddedProcedureCode("Invoice 12345 adjustment"),
    ).toBeNull();
    expect(
      extractEmbeddedProcedureCode("Member discount 10001 applied"),
    ).toBeNull();
  });

  it("returns null when no CPT code exists in the label", () => {
    expect(extractEmbeddedProcedureCode("Member discount adjustment")).toBeNull();
  });
});
