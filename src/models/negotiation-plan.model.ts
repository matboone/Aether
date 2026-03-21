import { Schema, Types, type InferSchemaType } from "mongoose";
import { getModel } from "@/src/models/_shared";

const assistanceAssessmentSchema = new Schema(
  {
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

const targetAskSchema = new Schema(
  {
    requestItemizedReview: { type: Boolean, required: true },
    requestSelfPayDiscount: { type: Boolean, required: true },
    requestFinancialAssistance: { type: Boolean, required: true },
    requestPaymentPlan: { type: Boolean, required: true },
  },
  { _id: false },
);

const negotiationPlanSchema = new Schema(
  {
    sessionId: { type: Types.ObjectId, required: true, ref: "Session" },
    hospitalId: { type: Types.ObjectId, required: true, ref: "HospitalPolicy" },
    analysisId: { type: Types.ObjectId, required: true, ref: "BillAnalysis" },
    assistanceAssessment: {
      type: assistanceAssessmentSchema,
      default: null,
    },
    nextActions: { type: [String], required: true },
    phoneScript: { type: [String], required: true },
    targetAsk: { type: targetAskSchema, required: true },
    callInstructions: { type: [String], required: true },
  },
  {
    collection: "negotiation_plans",
    timestamps: true,
  },
);

export type NegotiationPlanModelDocument = InferSchemaType<typeof negotiationPlanSchema>;
export const NegotiationPlanModel = getModel("NegotiationPlan", negotiationPlanSchema);
