import { Schema, Types, type InferSchemaType } from "mongoose";
import { getModel } from "@/src/models/_shared";

const resolutionSchema = new Schema(
  {
    sessionId: { type: Types.ObjectId, required: true, ref: "Session", index: true },
    originalAmount: { type: Number, default: null },
    reducedAmount: { type: Number, default: null },
    resolutionType: {
      type: String,
      enum: [
        "full_waiver",
        "partial_discount",
        "payment_plan",
        "waiver",
        "discount",
        "no_change",
      ],
      required: true,
    },
    notes: { type: String, default: null },
  },
  {
    collection: "resolutions",
    timestamps: true,
  },
);

export type ResolutionModelDocument = InferSchemaType<typeof resolutionSchema>;
export const ResolutionModel = getModel("Resolution", resolutionSchema);
