/**
 * Migration script to rename PENDING_PAYMENT status to OUTSTANDING
 *
 * Run with: npx tsx scripts/migrate-pending-payment-to-outstanding.ts
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting migration: PENDING_PAYMENT -> OUTSTANDING");

  // Find all projects with PENDING_PAYMENT status
  const projectsToUpdate = await prisma.project.findMany({
    where: { status: "PENDING_PAYMENT" },
    select: { id: true, projectName: true, status: true },
  });

  console.log(`Found ${projectsToUpdate.length} projects with PENDING_PAYMENT status`);

  if (projectsToUpdate.length === 0) {
    console.log("No projects to migrate. Done.");
    return;
  }

  // List projects to be updated
  console.log("\nProjects to be updated:");
  projectsToUpdate.forEach((p) => {
    console.log(`  - ID: ${p.id}, Name: ${p.projectName}`);
  });

  // Update all projects
  const result = await prisma.project.updateMany({
    where: { status: "PENDING_PAYMENT" },
    data: { status: "OUTSTANDING" },
  });

  console.log(`\nSuccessfully updated ${result.count} projects from PENDING_PAYMENT to OUTSTANDING`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
