import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { Types } from "mongoose";
import { env, hasTextractConfig } from "@/src/lib/env";
import { normalizeText } from "@/src/lib/normalize";
import { readUploadAsBuffer } from "@/src/lib/uploads";
import { ParsedBillModel } from "@/src/models/parsed-bill.model";
import { UploadedBillModel } from "@/src/models/uploaded-bill.model";
import { demoBillTemplates } from "@/src/seeds/data";
import type {
  DemoBillTemplate,
  ParsedBillLineItem,
  ParsedBillSourceType,
  ToolEvent,
} from "@/src/types/domain";
import type { ExtractBillDocumentOutputDto } from "@/src/types/dto";

export interface ParserInput {
  filename: string;
  mimeType: string;
  checksum?: string | null;
  bytes: Buffer;
  extractedText?: string | null;
}

interface ParserResult {
  hospitalName: string | null;
  totalAmount: number | null;
  phoneNumber: string | null;
  lineItems: ParsedBillLineItem[];
  sourceType: ParsedBillSourceType;
  fallbackUsed?: boolean;
  parserMode: "demo" | "textract";
  text?: string | null;
}

interface BillParser {
  parse(input: ParserInput): Promise<ParserResult>;
}

function decodeBestEffortText(bytes: Buffer): string {
  const raw = bytes.toString("utf8");
  return raw.replace(/\u0000/g, " ").trim();
}

function buildFallbackParseResult(text?: string | null): ParserResult {
  const sourceText = text?.trim();
  return {
    hospitalName: sourceText?.match(/hospital[:\s]+([A-Za-z ]+)/i)?.[1]?.trim() ?? null,
    totalAmount: sourceText
      ? Number(sourceText.match(/total[:\s$]+([\d,.]+)/i)?.[1]?.replace(/,/g, "")) || null
      : null,
    phoneNumber:
      sourceText?.match(/(\d{3}[-.)\s]\d{3}[-.\s]\d{4})/)?.[1] ?? null,
    sourceType: "unknown",
    lineItems: sourceText
      ? sourceText
          .split(/\n+/)
          .map((line) => line.trim())
          .map((line) => {
            const amountMatch = line.match(/\$?(\d[\d,]*\.?\d{0,2})$/);
            if (!amountMatch) {
              return null;
            }
            const amount = Number(amountMatch[1].replace(/,/g, ""));
            const rawLabel = line.replace(amountMatch[0], "").trim();
            if (!rawLabel) {
              return null;
            }
            return {
              rawLabel,
              amount: Number.isFinite(amount) ? amount : null,
            };
          })
          .filter((item): item is ParsedBillLineItem => Boolean(item))
      : [],
    fallbackUsed: true,
    parserMode: "demo",
    text: sourceText ?? null,
  };
}

function matchDemoTemplate(input: ParserInput): DemoBillTemplate | null {
  const normalizedName = normalizeText(input.filename);
  const text = normalizeText(input.extractedText ?? decodeBestEffortText(input.bytes));

  const checksumMatch = input.checksum
    ? demoBillTemplates.find((template) => template.checksum === input.checksum)
    : null;

  if (checksumMatch) {
    return checksumMatch;
  }

  const filenameMatch = demoBillTemplates.find((template) =>
    template.filenameHints.some((hint) => normalizedName.includes(normalizeText(hint))),
  );

  if (filenameMatch) {
    return filenameMatch;
  }

  const textMatch = demoBillTemplates.find((template) =>
    template.textPatterns.every((pattern) =>
      text.includes(normalizeText(pattern)),
    ),
  );

  return textMatch ?? null;
}

class DemoSeededParser implements BillParser {
  async parse(input: ParserInput): Promise<ParserResult> {
    const matchedTemplate = matchDemoTemplate(input);
    if (matchedTemplate) {
      return {
        hospitalName: matchedTemplate.hospitalName,
        totalAmount: matchedTemplate.totalAmount,
        phoneNumber: matchedTemplate.phoneNumber,
        lineItems: matchedTemplate.lineItems,
        sourceType: matchedTemplate.sourceType,
        parserMode: "demo",
        text: input.extractedText ?? decodeBestEffortText(input.bytes),
      };
    }

    return buildFallbackParseResult(
      input.extractedText ?? decodeBestEffortText(input.bytes),
    );
  }
}

class TextractParser implements BillParser {
  private readonly client: TextractClient;

  constructor() {
    this.client = new TextractClient({
      region: env.awsRegion(),
      credentials: hasTextractConfig()
        ? {
            accessKeyId: env.awsAccessKeyId()!,
            secretAccessKey: env.awsSecretAccessKey()!,
          }
        : undefined,
    });
  }

  async parse(input: ParserInput): Promise<ParserResult> {
    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: Uint8Array.from(input.bytes),
      },
      FeatureTypes: ["TABLES", "FORMS"],
    });

    const response = await this.client.send(command);
    const lines = (response.Blocks ?? [])
      .filter((block) => block.BlockType === "LINE" && block.Text)
      .map((block) => block.Text!.trim());
    const text = lines.join("\n");

    const templateMatch = matchDemoTemplate({
      ...input,
      extractedText: text,
    });
    if (templateMatch) {
      return {
        hospitalName: templateMatch.hospitalName,
        totalAmount: templateMatch.totalAmount,
        phoneNumber: templateMatch.phoneNumber,
        lineItems: templateMatch.lineItems,
        sourceType: templateMatch.sourceType,
        parserMode: "textract",
        text,
      };
    }

    const lineItems = lines
      .map((line) => {
        const amountMatch = line.match(/\$?(\d[\d,]*\.?\d{0,2})$/);
        if (!amountMatch) {
          return null;
        }

        const amount = Number(amountMatch[1].replace(/,/g, ""));
        const rawLabel = line.replace(amountMatch[0], "").trim();

        if (!rawLabel) {
          return null;
        }

        const codeMatch = line.match(/\b(\d{5})\b/);

        return {
          rawLabel,
          amount: Number.isFinite(amount) ? amount : null,
          code: codeMatch?.[1] ?? null,
        };
      })
      .filter(
        (
          item,
        ): item is { rawLabel: string; amount: number | null; code: string | null } =>
          item !== null,
      );

    const totalAmountMatch = text.match(/total(?: due| amount)?[:\s$]+([\d,.]+)/i);
    const phoneMatch = text.match(/(\d{3}[-.)\s]\d{3}[-.\s]\d{4})/);
    const hospitalLine = lines[0] ?? null;

    return {
      hospitalName: hospitalLine,
      totalAmount: totalAmountMatch
        ? Number(totalAmountMatch[1].replace(/,/g, ""))
        : null,
      phoneNumber: phoneMatch?.[1] ?? null,
      lineItems: lineItems.map((item) => ({
        rawLabel: item.rawLabel,
        amount: item.amount,
        code: item.code,
      })),
      sourceType: lineItems.length > 1 ? "itemized_statement" : "summary_bill",
      parserMode: "textract",
      text,
    };
  }
}

const demoParser = new DemoSeededParser();

function getPreferredParser(): BillParser {
  if (env.parserMode() === "textract" && hasTextractConfig()) {
    return new TextractParser();
  }

  return demoParser;
}

export const parserService = {
  async extractBillDocument(input: {
    uploadedBillId: string;
  }): Promise<ExtractBillDocumentOutputDto & { toolEvents: ToolEvent[] }> {
    const uploadedBill = await UploadedBillModel.findById(input.uploadedBillId);
    if (!uploadedBill) {
      throw new Error("Uploaded bill not found");
    }

    const bytes = await readUploadAsBuffer(uploadedBill.storagePath);
    const preferredParser = getPreferredParser();
    const toolEvents: ToolEvent[] = [];
    let parsed = await preferredParser.parse({
      filename: uploadedBill.filename,
      mimeType: uploadedBill.mimeType,
      checksum: uploadedBill.checksum,
      bytes,
      extractedText: uploadedBill.extractedText,
    });

    if (parsed.fallbackUsed) {
      toolEvents.push({
        tool: "extractBillDocument",
        status: "fallback",
        message: "Parser used the deterministic fallback extraction path.",
      });
    }

    if (parsed.parserMode !== env.parserMode()) {
      toolEvents.push({
        tool: "extractBillDocument",
        status: "fallback",
        message: `Parser mode "${env.parserMode()}" was unavailable. Used "${parsed.parserMode}" instead.`,
      });
    }

    if (
      parsed.parserMode === "textract" &&
      (!parsed.lineItems.length || !parsed.hospitalName)
    ) {
      parsed = await demoParser.parse({
        filename: uploadedBill.filename,
        mimeType: uploadedBill.mimeType,
        checksum: uploadedBill.checksum,
        bytes,
        extractedText: parsed.text,
      });
      toolEvents.push({
        tool: "extractBillDocument",
        status: "fallback",
        message: "Textract returned incomplete results, so demo-safe parsing was used.",
      });
    }

    const created = await ParsedBillModel.create({
      sessionId: new Types.ObjectId(uploadedBill.sessionId),
      uploadedBillId: new Types.ObjectId(uploadedBill._id),
      hospitalName: parsed.hospitalName,
      totalAmount: parsed.totalAmount,
      phoneNumber: parsed.phoneNumber,
      sourceType: parsed.sourceType,
      lineItems: parsed.lineItems.map((item) => ({
        rawLabel: item.rawLabel,
        amount: item.amount,
        ...(item.code !== undefined ? { code: item.code } : {}),
      })),
    });

    return {
      parsedBillId: created._id.toString(),
      hospitalName: created.hospitalName,
      totalAmount: created.totalAmount,
      phoneNumber: created.phoneNumber,
      lineItems: created.lineItems,
      sourceType: created.sourceType,
      toolEvents,
    };
  },

  async extractTransientBill(file: File) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const parser = getPreferredParser();
    let parsed = await parser.parse({
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      bytes,
    });

    if (parsed.parserMode === "textract" && !parsed.lineItems.length) {
      parsed = await demoParser.parse({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        bytes,
      });
    }

    return {
      hospitalName: parsed.hospitalName,
      totalAmount: parsed.totalAmount,
      phoneNumber: parsed.phoneNumber,
      lineItems: parsed.lineItems,
      sourceType: parsed.sourceType,
    };
  },
};
