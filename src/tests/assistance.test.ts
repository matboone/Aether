import { describe, expect, it } from "bun:test";
import { assistanceService } from "@/src/services/assistance.service";

describe("assistanceService.normalizeIncomeBracket", () => {
  it("keeps supported bracket values unchanged", () => {
    expect(assistanceService.normalizeIncomeBracket("0_50k")).toBe("0_50k");
    expect(assistanceService.normalizeIncomeBracket("50k_80k")).toBe("50k_80k");
    expect(assistanceService.normalizeIncomeBracket("80k_plus")).toBe("80k_plus");
  });

  it("maps numeric values to seeded brackets", () => {
    expect(assistanceService.normalizeIncomeBracket("42000")).toBe("0_50k");
    expect(assistanceService.normalizeIncomeBracket("62000")).toBe("50k_80k");
    expect(assistanceService.normalizeIncomeBracket("110000")).toBe("80k_plus");
  });

  it("adjusts by household size when provided", () => {
    expect(assistanceService.normalizeIncomeBracket("90000", 2)).toBe("0_50k");
  });
});
