import { Schema, Types, type InferSchemaType } from "mongoose";
import { getModel } from "@/src/models/_shared";

const lineItemSchema = new Schema(
  {
    rawLabel: { type: String, required: true },
    amount: { type: Number, default: null },
    code: { type: String, default: null },
  },
  { _id: false },
);

const parsedBillSchema = new Schema(
  {
    sessionId: { type: Types.ObjectId, required: true, ref: "Session", index: true },
    uploadedBillId: {
      type: Types.ObjectId,
      required: true,
      ref: "UploadedBill",
    },
    hospitalName: { type: String, default: null },
    totalAmount: { type: Number, default: null },
    phoneNumber: { type: String, default: null },
    email: { type: String, default: null },
    sourceType: {
      type: String,
      enum: ["itemized_statement", "summary_bill", "unknown"],
      required: true,
    },
    lineItems: { type: [lineItemSchema], required: true },
  },
  {
    collection: "parsed_bills",
    timestamps: true,
  },
);

export type ParsedBillModelDocument = InferSchemaType<typeof parsedBillSchema>;
export const ParsedBillModel = getModel("ParsedBill", parsedBillSchema);
