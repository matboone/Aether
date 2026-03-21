import { ProcedureBenchmarkModel } from "@/src/models/procedure-benchmark.model";
import { logInfo } from "@/src/lib/logger";
import { inferCategory, normalizeKey, normalizeText } from "@/src/lib/normalize";
import { ParsedBillModel } from "@/src/models/parsed-bill.model";
import { ApiError } from "@/src/lib/api";
import type {
  ClassifiedBillItem,
  ProcedureBenchmarkDocument,
} from "@/src/types/domain";
import type { ClassifyBillItemsOutputDto } from "@/src/types/dto";

export function extractEmbeddedProcedureCode(label: string): string | null {
  const match = label.match(/\b(\d{5})\b/);
  return match?.[1] ?? null;
}

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
    const embeddedCode = extractEmbeddedProcedureCode(input.label);
    const lookupCode = input.code ?? embeddedCode;

    if (lookupCode) {
      const codeMatch = await ProcedureBenchmarkModel.findOne({
        code: lookupCode,
      }).lean();

      if (codeMatch) {
        logInfo("benchmark.service", "procedure.matched", {
          label: input.label,
          lookupCode,
          matchType: "code",
          normalizedKey: codeMatch.normalizedKey,
          category: codeMatch.category,
        });
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
      logInfo("benchmark.service", "procedure.matched", {
        label: input.label,
        lookupCode,
        matchType: "normalized_key",
        normalizedKey: exactMatch.normalizedKey,
        category: exactMatch.category,
      });
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
      logInfo("benchmark.service", "procedure.matched", {
        label: input.label,
        lookupCode,
        matchType: "keyword",
        normalizedKey: keywordMatch.normalizedKey,
        category: keywordMatch.category,
      });
      return {
        normalizedKey: keywordMatch.normalizedKey,
        category: keywordMatch.category,
        benchmark: benchmarkToLeanMatch(keywordMatch),
      };
    }

    logInfo("benchmark.service", "procedure.unmatched", {
      label: input.label,
      lookupCode,
      normalizedKey: exactKey,
      category: inferCategory(input.label),
    });
    return {
      normalizedKey: exactKey,
      category: inferCategory(input.label),
      benchmark: null,
    };
  },

  async classifyBillItems(input: {
    parsedBillId: string;
  }): Promise<ClassifyBillItemsOutputDto> {
    logInfo("benchmark.service", "classification.started", {
      parsedBillId: input.parsedBillId,
    });
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
          code: item.code ?? extractEmbeddedProcedureCode(item.rawLabel),
          chargedAmount: item.amount ?? 0,
          category: match.category,
        };
      }),
    );

    logInfo("benchmark.service", "classification.completed", {
      parsedBillId: input.parsedBillId,
      itemCount: normalizedItems.length,
      categories: normalizedItems.map((item) => item.category),
    });

    return { normalizedItems };
  },
};
