import { connectToDatabase } from "@/src/lib/db";
import { HospitalPolicyModel } from "@/src/models/hospital-policy.model";
import { ProcedureBenchmarkModel } from "@/src/models/procedure-benchmark.model";
import { hospitalPoliciesSeed, procedureBenchmarksSeed } from "@/src/seeds/data";

export async function runSeed() {
  await connectToDatabase();

  await Promise.all([
    HospitalPolicyModel.deleteMany({}),
    ProcedureBenchmarkModel.deleteMany({}),
  ]);

  let hospitalPoliciesUpserted = 0;
  for (const policy of hospitalPoliciesSeed) {
    await HospitalPolicyModel.create(policy);
    hospitalPoliciesUpserted += 1;
  }

  let procedureBenchmarksUpserted = 0;
  for (const benchmark of procedureBenchmarksSeed) {
    await ProcedureBenchmarkModel.create(benchmark);
    procedureBenchmarksUpserted += 1;
  }

  return {
    hospitalPoliciesUpserted,
    procedureBenchmarksUpserted,
  };
}
