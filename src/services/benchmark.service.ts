import { ProcedureBenchmarkModel } from "@/src/models/procedure-benchmark.model";
import { inferCategory, normalizeKey, normalizeText } from "@/src/lib/normalize";
import { ParsedBillModel } from "@/src/models/parsed-bill.model";
import { ApiError } from "@/src/lib/api";
import type {
  ClassifiedBillItem,
  ProcedureBenchmarkDocument,
} from "@/src/types/domain";
import type { ClassifyBillItemsOutputDto } from "@/src/types/dto";

function benchmarkToLeanMatch(benchmark: {
  normalizedKey: string;
  code?: string | null;
  displayLabel: string;
  keywords: string[];
  category: ProcedureBenchmarkDocument["category"];
}) {
  return {
    normalizedKey: benchmark.normalizedKey,
    code: benchmark.code ?? null,
    displayLabel: benchmark.displayLabel,
    keywords: benchmark.keywords,
    category: benchmark.category,
  };
}

export const benchmarkService = {
  async matchProcedure(input: {
    label: string;
    code?: string | null;
  }): Promise<{
    normalizedKey: string;
    category: ClassifiedBillItem["category"];
    benchmark:
      | {
          normalizedKey: string;
          code?: string | null;
          displayLabel: string;
          keywords: string[];
          category: ClassifiedBillItem["category"];
        }
      | null;
  }> {
    const labelNormalized = normalizeText(input.label);

    if (input.code) {
      const codeMatch = await ProcedureBenchmarkModel.findOne({
        code: input.code,
      }).lean();

      if (codeMatch) {
        return {
          normalizedKey: codeMatch.normalizedKey,
          category: codeMatch.category,
          benchmark: benchmarkToLeanMatch(codeMatch),
        };
      }
    }

    const exactKey = normalizeKey(input.label);
    const exactMatch = await ProcedureBenchmarkModel.findOne({
      normalizedKey: exactKey,
    }).lean();
    if (exactMatch) {
      return {
        normalizedKey: exactMatch.normalizedKey,
        category: exactMatch.category,
        benchmark: benchmarkToLeanMatch(exactMatch),
      };
    }

    const benchmarks = await ProcedureBenchmarkModel.find().lean();
    const keywordMatch = benchmarks.find((benchmark) =>
      benchmark.keywords.some((keyword: string) =>
        labelNormalized.includes(normalizeText(keyword)),
      ),
    );

    if (keywordMatch) {
      return {
        normalizedKey: keywordMatch.normalizedKey,
        category: keywordMatch.category,
        benchmark: benchmarkToLeanMatch(keywordMatch),
      };
    }

    return {
      normalizedKey: exactKey,
      category: inferCategory(input.label),
      benchmark: null,
    };
  },

  async classifyBillItems(input: {
    parsedBillId: string;
  }): Promise<ClassifyBillItemsOutputDto> {
    const parsedBill = await ParsedBillModel.findById(input.parsedBillId).lean();
    if (!parsedBill) {
      throw new ApiError("PARSED_BILL_NOT_FOUND", "Parsed bill not found", 404);
    }

    const normalizedItems = await Promise.all(
      parsedBill.lineItems.map(async (item: { rawLabel: string; code?: string | null; amount: number | null }) => {
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

    return { normalizedItems };
  },
};
