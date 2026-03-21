import { connectToDatabase } from "@/src/lib/db";
import { BillAnalysisModel } from "@/src/models/bill-analysis.model";
import { MessageModel } from "@/src/models/message.model";
import { NegotiationPlanModel } from "@/src/models/negotiation-plan.model";
import { ParsedBillModel } from "@/src/models/parsed-bill.model";
import { ResolutionModel } from "@/src/models/resolution.model";
import { SessionModel } from "@/src/models/session.model";
import { UploadedBillModel } from "@/src/models/uploaded-bill.model";
import { runSeed } from "@/src/seeds/seed";

export async function runDemoReset() {
  await connectToDatabase();
  const [
    messagesDeleted,
    uploadsDeleted,
    parsedBillsDeleted,
    analysesDeleted,
    plansDeleted,
    resolutionsDeleted,
    sessionsDeleted,
  ] = await Promise.all([
    MessageModel.deleteMany({}),
    UploadedBillModel.deleteMany({}),
    ParsedBillModel.deleteMany({}),
    BillAnalysisModel.deleteMany({}),
    NegotiationPlanModel.deleteMany({}),
    ResolutionModel.deleteMany({}),
    SessionModel.deleteMany({}),
  ]);
  const seeded = await runSeed();

  return {
    deleted: {
      messages: messagesDeleted.deletedCount,
      uploadedBills: uploadsDeleted.deletedCount,
      parsedBills: parsedBillsDeleted.deletedCount,
      analyses: analysesDeleted.deletedCount,
      plans: plansDeleted.deletedCount,
      resolutions: resolutionsDeleted.deletedCount,
      sessions: sessionsDeleted.deletedCount,
    },
    seeded,
  };
}
