import { describe, expect, it } from "bun:test";
import { inferCategory, normalizeKey, normalizeText } from "@/src/lib/normalize";

describe("normalization helpers", () => {
  it("normalizes free text consistently", () => {
    expect(normalizeText("CT Scan Abdomen!!")).toBe("ct scan abdomen");
    expect(normalizeKey("CT Scan Abdomen!!")).toBe("ct_scan_abdomen");
  });

  it("infers categories with deterministic keyword rules", () => {
    expect(inferCategory("CT Scan Abdomen")).toBe("imaging");
    expect(inferCategory("Blood Test")).toBe("lab");
    expect(inferCategory("Physician Consult")).toBe("physician");
    expect(inferCategory("IV Fluids")).toBe("medication");
    expect(inferCategory("ER Facility Fee")).toBe("facility");
  });
});
