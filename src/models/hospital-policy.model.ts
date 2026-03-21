import { Schema, type InferSchemaType } from "mongoose";
import { getModel } from "@/src/models/_shared";

const assistanceMatrixSchema = new Schema(
  {
    incomeBracket: {
      type: String,
      enum: ["0_50k", "50k_80k", "80k_plus"],
      required: true,
    },
    likelyEligible: { type: Boolean, required: true },
    likelyOutcome: {
      type: String,
      enum: ["full_waiver", "partial_discount", "payment_plan", "unclear"],
      required: true,
    },
    rationale: { type: [String], required: true },
  },
  { _id: false },
);

const hospitalPolicySchema = new Schema(
  {
    canonicalName: { type: String, required: true, unique: true },
    aliases: { type: [String], required: true, index: true },
    phoneNumber: { type: String, default: null },
    billingDepartmentPath: { type: String, default: null },
    hasFinancialAssistance: { type: Boolean, required: true },
    uninsuredDiscountAvailable: { type: Boolean, required: true },
    recommendedSteps: { type: [String], required: true },
    negotiationScript: { type: [String], required: true },
    assistanceNotes: { type: [String], required: true },
    assistanceMatrix: { type: [assistanceMatrixSchema], required: true },
  },
  {
    collection: "hospital_policies",
    timestamps: true,
  },
);

export type HospitalPolicyModelDocument = InferSchemaType<typeof hospitalPolicySchema>;
export const HospitalPolicyModel = getModel("HospitalPolicy", hospitalPolicySchema);
