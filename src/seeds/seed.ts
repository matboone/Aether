import { connectToDatabase } from "@/src/lib/db";
import { HospitalPolicyModel } from "@/src/models/hospital-policy.model";
import { ProcedureBenchmarkModel } from "@/src/models/procedure-benchmark.model";
import { hospitalPoliciesSeed, procedureBenchmarksSeed } from "@/src/seeds/data";

export async function runSeed() {
  await connectToDatabase();

  for (const policy of hospitalPoliciesSeed) {
    await HospitalPolicyModel.updateOne(
      { canonicalName: policy.canonicalName },
      { $set: policy },
      { upsert: true },
    );
  }

  for (const benchmark of procedureBenchmarksSeed) {
    await ProcedureBenchmarkModel.updateOne(
      { normalizedKey: benchmark.normalizedKey },
      { $set: benchmark },
      { upsert: true },
    );
  }
}
