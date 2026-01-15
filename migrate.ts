import { PrismaClient } from "./generated/prisma/index.js";


// Use 'datasourceUrl' for direct URL overriding
const oldDb = new PrismaClient({
  datasourceUrl: "postgresql://postgres:Tiller_@159@118.179.197.118:5432/project_billing_system?sslmode=disable",
});

const newDb = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_Cb0rpAsQl6Wf@ep-soft-glitter-ahwyvtzr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

async function migrate() {
  try {
    console.log("🚀 Starting migration...");

    // 1. Independent Tables (No dependencies)
    console.log("Migrating Users...");
    const users = await oldDb.user.findMany();
    await newDb.user.createMany({ data: users });

    console.log("Migrating Clients...");
    const clients = await oldDb.client.findMany();
    await newDb.client.createMany({ data: clients });

    console.log("Migrating Departments...");
    const depts = await oldDb.department.findMany();
    await newDb.department.createMany({ data: depts });

    console.log("Migrating Categories...");
    const cats = await oldDb.projectCategory.findMany();
    await newDb.projectCategory.createMany({ data: cats });

    // 2. Dependent Tables (Foreign Keys to Clients/Depts/Cats)
    console.log("Migrating Projects...");
    const projects = await oldDb.project.findMany();
    await newDb.project.createMany({ data: projects });

    // 3. Deepest Level (Foreign Keys to Projects)
    console.log("Migrating Project Bills...");
    const bills = await oldDb.projectBill.findMany();
    await newDb.projectBill.createMany({ data: bills });

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

migrate();