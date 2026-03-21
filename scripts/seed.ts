import { disconnectFromDatabase } from "@/src/lib/db";
import { runSeed } from "@/src/seeds/seed";

try {
  process.stdout.write("Seeding MongoDB reference data...\n");
  const result = await runSeed();
  process.stdout.write(
    `Seed complete. Upserted ${result.hospitalPoliciesUpserted} hospital policies and ${result.procedureBenchmarksUpserted} procedure benchmarks.\n`,
  );
} catch (error) {
  process.stderr.write(
    `Seed failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
} finally {
  await disconnectFromDatabase();
}
