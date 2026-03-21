import { Schema, type InferSchemaType } from "mongoose";
import { getModel } from "@/src/models/_shared";

const negotiationOutcomeSchema = new Schema(
  {
    originalAmount: { type: Number, default: null },
    reducedAmount: { type: Number, default: null },
    paymentPlanOffered: { type: Boolean, default: null },
    notes: { type: String, default: null },
  },
  { _id: false },
);

const sessionFactsSchema = new Schema(
  {
    hospitalName: { type: String },
    hospitalId: { type: String },
    hasInsurance: { type: Boolean, default: null },
    incidentSummary: { type: String },
    estimatedBillTotal: { type: Number, default: null },
    uploadedBillId: { type: String },
    parsedBillId: { type: String },
    analysisId: { type: String },
    planId: { type: String, default: null },
    incomeBracket: { type: String, default: null },
    householdSize: { type: Number, default: null },
    assistanceEligible: { type: Boolean, default: null },
    negotiationOutcome: {
      type: negotiationOutcomeSchema,
      default: null,
    },
  },
  { _id: false },
);

const sessionSchema = new Schema(
  {
    step: {
      type: String,
      enum: [
        "NEW",
        "INTAKE",
        "AWAITING_BILL_UPLOAD",
        "BILL_UPLOADED",
        "BILL_PARSED",
        "BILL_ANALYZED",
        "AWAITING_INCOME",
        "STRATEGY_READY",
        "NEGOTIATION_IN_PROGRESS",
        "RESOLUTION_RECORDED",
        "COMPLETE",
        "ERROR",
      ],
      required: true,
      index: true,
    },
    facts: {
      type: sessionFactsSchema,
      required: true,
      default: {},
    },
  },
  {
    collection: "sessions",
    timestamps: true,
  },
);

export type SessionModelDocument = InferSchemaType<typeof sessionSchema>;
export const SessionModel = getModel("Session", sessionSchema);
