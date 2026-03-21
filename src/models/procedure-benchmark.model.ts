import { Schema, type InferSchemaType } from "mongoose";
import { getModel } from "@/src/models/_shared";

const procedureBenchmarkSchema = new Schema(
  {
    normalizedKey: { type: String, required: true, unique: true, index: true },
    code: { type: String, default: null, index: true },
    displayLabel: { type: String, required: true },
    keywords: { type: [String], required: true },
    category: {
      type: String,
      enum: ["facility", "lab", "imaging", "physician", "medication", "other"],
      required: true,
    },
    benchmarkAmount: { type: Number, required: true },
    fairRangeLow: { type: Number, required: true },
    fairRangeHigh: { type: Number, required: true },
  },
  {
    collection: "procedure_benchmarks",
    timestamps: true,
  },
);

export type ProcedureBenchmarkModelDocument = InferSchemaType<typeof procedureBenchmarkSchema>;
export const ProcedureBenchmarkModel = getModel("ProcedureBenchmark", procedureBenchmarkSchema);
