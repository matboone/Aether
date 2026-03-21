import { Types } from "mongoose";
import { ApiError } from "@/src/lib/api";
import { normalizeText } from "@/src/lib/normalize";
import { BillAnalysisModel } from "@/src/models/bill-analysis.model";
import { ParsedBillModel } from "@/src/models/parsed-bill.model";
import { ProcedureBenchmarkModel } from "@/src/models/procedure-benchmark.model";
import { benchmarkService } from "@/src/services/benchmark.service";
import type {
  AnalyzedItem,
  BillAnalysisDocument,
  ClassifiedBillItem,
  FlagReason,
  FlagSeverity,
  ParsedBillLineItem,
} from "@/src/types/domain";
import type { AnalyzeBillPricingOutputDto } from "@/src/types/dto";

function computeSeverity(
  chargedAmount: number,
  benchmarkAmount: number,
  fairRangeHigh: number,
): FlagSeverity | null {
  if (chargedAmount > benchmarkAmount * 1.75) {
    return "high";
  }

  if (chargedAmount > benchmarkAmount * 1.4) {
    return "medium";
  }

  if (chargedAmount > fairRangeHigh) {
    return "low";
  }

  return null;
}

function makeFlag(
  item: { label: string; chargedAmount: number },
  benchmark: {
    benchmarkAmount: number;
    fairRangeLow: number;
    fairRangeHigh: number;
  },
  reason: FlagReason,
  severity: FlagSeverity,
) {
  return {
    label: item.label,
    chargedAmount: item.chargedAmount,
    benchmarkAmount: benchmark.benchmarkAmount,
    fairRangeLow: benchmark.fairRangeLow,
    fairRangeHigh: benchmark.fairRangeHigh,
    severity,
    reason,
    suggestedTargetAmount: benchmark.fairRangeHigh,
  };
}

function buildAllItems(
  normalizedItems: ClassifiedBillItem[],
  benchmarksByKey: Map<string, { benchmarkAmount: number }>,
): AnalyzedItem[] {
  return normalizedItems.map((item) => {
    const benchmark = benchmarksByKey.get(item.normalizedKey);
    return {
      label: item.label,
      chargedAmount: item.chargedAmount,
      benchmarkAmount: benchmark?.benchmarkAmount ?? null,
      matched: Boolean(benchmark),
    };
  });
}

function detectDuplicateFlags(
  normalizedItems: ClassifiedBillItem[],
  benchmarksByKey: Map<
    string,
    { benchmarkAmount: number; fairRangeLow: number; fairRangeHigh: number }
  >,
) {
  const flags: BillAnalysisDocument["flaggedItems"] = [];
  const groups = new Map<string, ClassifiedBillItem[]>();

  normalizedItems.forEach((item) => {
    const group = groups.get(item.normalizedKey) ?? [];
    group.push(item);
    groups.set(item.normalizedKey, group);
  });

  for (const [normalizedKey, items] of groups.entries()) {
    if (items.length < 2) {
      continue;
    }

    const benchmark = benchmarksByKey.get(normalizedKey);
    if (!benchmark) {
      continue;
    }

    const sorted = items
      .slice()
      .sort((a, b) => a.chargedAmount - b.chargedAmount);

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const delta = Math.abs(current.chargedAmount - previous.chargedAmount);
      if (delta <= Math.max(25, previous.chargedAmount * 0.08)) {
        flags.push(
          makeFlag(
            current,
            benchmark,
            "duplicate_like",
            current.category === "facility" ? "high" : "medium",
          ),
        );
      }
    }
  }

  return flags;
}

async function classifyParsedBillLineItems(lineItems: ParsedBillLineItem[]) {
  return Promise.all(
    lineItems
      .filter((item) => typeof item.amount === "number")
      .map(async (item) => {
        const match = await benchmarkService.matchProcedure({
          label: item.rawLabel,
          code: item.code,
        });

        return {
          label: item.rawLabel,
          normalizedKey: match.normalizedKey,
          code: item.code ?? null,
          chargedAmount: item.amount ?? 0,
          category: match.category,
        };
      }),
  );
}

export const analysisService = {
  async analyzeBillPricing(input: {
    parsedBillId: string;
  }): Promise<AnalyzeBillPricingOutputDto> {
    const parsedBill = await ParsedBillModel.findById(input.parsedBillId).lean();
    if (!parsedBill) {
      throw new ApiError("PARSED_BILL_NOT_FOUND", "Parsed bill not found", 404);
    }

    const normalizedItems = await classifyParsedBillLineItems(parsedBill.lineItems);
    const benchmarks = await ProcedureBenchmarkModel.find().lean();
    const benchmarksByKey = new Map(
      benchmarks.map((benchmark) => [benchmark.normalizedKey, benchmark]),
    );

    const flaggedItems: BillAnalysisDocument["flaggedItems"] = [];

    normalizedItems.forEach((item) => {
      const benchmark = benchmarksByKey.get(item.normalizedKey);
      if (!benchmark) {
        return;
      }

      const severity = computeSeverity(
        item.chargedAmount,
        benchmark.benchmarkAmount,
        benchmark.fairRangeHigh,
      );

      if (severity) {
        flaggedItems.push(
          makeFlag(item, benchmark, "above_benchmark", severity),
        );
      }

      if (
        item.category === "facility" &&
        normalizeText(item.label).includes("facility") &&
        item.chargedAmount > benchmark.benchmarkAmount * 1.5
      ) {
        flaggedItems.push(
          makeFlag(item, benchmark, "suspicious_facility_fee", "high"),
        );
      }
    });

    flaggedItems.push(...detectDuplicateFlags(normalizedItems, benchmarksByKey));

    const allItems = buildAllItems(normalizedItems, benchmarksByKey);
    const originalTotal =
      parsedBill.totalAmount ??
      normalizedItems.reduce((sum, item) => sum + item.chargedAmount, 0);
    const estimatedOvercharge = flaggedItems.reduce((sum, item) => {
      const overage = item.chargedAmount - item.suggestedTargetAmount;
      return sum + Math.max(overage, 0);
    }, 0);

    const analysis = await BillAnalysisModel.create({
      sessionId: new Types.ObjectId(parsedBill.sessionId),
      parsedBillId: new Types.ObjectId(parsedBill._id),
      originalTotal,
      estimatedOvercharge,
      flaggedItems,
      allItems,
    });

    return {
      analysisId: analysis._id.toString(),
      summary: {
        originalTotal,
        flaggedCount: flaggedItems.length,
        estimatedOvercharge,
      },
      flaggedItems,
      allItems,
    };
  },

  async getAnalysisById(analysisId: string) {
    const analysis = await BillAnalysisModel.findById(analysisId).lean();
    if (!analysis) {
      throw new ApiError("ANALYSIS_NOT_FOUND", "Analysis not found", 404);
    }
    return analysis;
  },

  async analyzeTransientBill(input: {
    parsedBill: {
      totalAmount: number | null;
      lineItems: ParsedBillLineItem[];
    };
  }) {
    const normalizedItems = await classifyParsedBillLineItems(input.parsedBill.lineItems);
    const benchmarks = await ProcedureBenchmarkModel.find().lean();
    const benchmarksByKey = new Map(
      benchmarks.map((benchmark) => [benchmark.normalizedKey, benchmark]),
    );
    const flaggedItems: BillAnalysisDocument["flaggedItems"] = [];

    normalizedItems.forEach((item) => {
      const benchmark = benchmarksByKey.get(item.normalizedKey);
      if (!benchmark) {
        return;
      }

      const severity = computeSeverity(
        item.chargedAmount,
        benchmark.benchmarkAmount,
        benchmark.fairRangeHigh,
      );

      if (severity) {
        flaggedItems.push(
          makeFlag(item, benchmark, "above_benchmark", severity),
        );
      }
    });

    flaggedItems.push(...detectDuplicateFlags(normalizedItems, benchmarksByKey));

    const allItems = buildAllItems(normalizedItems, benchmarksByKey);
    const originalTotal =
      input.parsedBill.totalAmount ??
      normalizedItems.reduce((sum, item) => sum + item.chargedAmount, 0);

    return {
      summary: {
        originalTotal,
        flaggedCount: flaggedItems.length,
        estimatedOvercharge: flaggedItems.reduce(
          (sum, item) => sum + Math.max(item.chargedAmount - item.suggestedTargetAmount, 0),
          0,
        ),
      },
      flaggedItems,
      allItems,
      unmatchedItems: allItems
        .filter((item) => !item.matched)
        .map((item) => ({
          label: item.label,
          chargedAmount: item.chargedAmount,
        })),
    };
  },
};
