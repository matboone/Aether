import { disconnectFromDatabase } from "@/src/lib/db";
import { runDemoReset } from "@/src/seeds/demo-reset";

try {
  process.stdout.write("Resetting demo collections and reseeding reference data...\n");
  const result = await runDemoReset();
  process.stdout.write(
    `Demo reset complete. Deleted ${result.deleted.sessions} sessions, ${result.deleted.messages} messages, ${result.deleted.uploadedBills} uploads, ${result.deleted.parsedBills} parsed bills, ${result.deleted.analyses} analyses, ${result.deleted.plans} plans, and ${result.deleted.resolutions} resolutions. Reseeded ${result.seeded.hospitalPoliciesUpserted} hospital policies and ${result.seeded.procedureBenchmarksUpserted} benchmarks.\n`,
  );
} catch (error) {
  process.stderr.write(
    `Demo reset failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
} finally {
  await disconnectFromDatabase();
}
