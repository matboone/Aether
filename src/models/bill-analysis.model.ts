import { Schema, Types, type InferSchemaType } from "mongoose";
import { getModel } from "@/src/models/_shared";

const flaggedItemSchema = new Schema(
  {
    label: { type: String, required: true },
    chargedAmount: { type: Number, required: true },
    benchmarkAmount: { type: Number, required: true },
    fairRangeLow: { type: Number, required: true },
    fairRangeHigh: { type: Number, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], required: true },
    reason: {
      type: String,
      enum: ["above_benchmark", "duplicate_like", "suspicious_facility_fee"],
      required: true,
    },
    suggestedTargetAmount: { type: Number, required: true },
  },
  { _id: false },
);

const analyzedItemSchema = new Schema(
  {
    label: { type: String, required: true },
    chargedAmount: { type: Number, required: true },
    benchmarkAmount: { type: Number, default: null },
    matched: { type: Boolean, required: true },
  },
  { _id: false },
);

const billAnalysisSchema = new Schema(
  {
    sessionId: { type: Types.ObjectId, required: true, ref: "Session", index: true },
    parsedBillId: { type: Types.ObjectId, required: true, ref: "ParsedBill" },
    originalTotal: { type: Number, required: true },
    estimatedOvercharge: { type: Number, required: true },
    flaggedItems: { type: [flaggedItemSchema], required: true },
    allItems: { type: [analyzedItemSchema], required: true },
  },
  {
    collection: "bill_analyses",
    timestamps: true,
  },
);

export type BillAnalysisModelDocument = InferSchemaType<typeof billAnalysisSchema>;
export const BillAnalysisModel = getModel("BillAnalysis", billAnalysisSchema);
