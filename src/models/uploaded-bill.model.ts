import { Schema, Types, type InferSchemaType } from "mongoose";
import { getModel } from "@/src/models/_shared";

const uploadedBillSchema = new Schema(
  {
    sessionId: { type: Types.ObjectId, required: true, ref: "Session", index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    storagePath: { type: String, required: true },
    checksum: { type: String, default: null },
    extractedText: { type: String, default: null },
    status: {
      type: String,
      enum: ["uploaded", "processing", "processed", "failed"],
      required: true,
    },
  },
  {
    collection: "uploaded_bills",
    timestamps: true,
  },
);

export type UploadedBillModelDocument = InferSchemaType<typeof uploadedBillSchema>;
export const UploadedBillModel = getModel("UploadedBill", uploadedBillSchema);
