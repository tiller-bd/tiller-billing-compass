// scripts/create-admin.ts
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

// 1. Setup the connection pool and adapter
// This must match your application's database configuration
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// 2. Initialize Prisma with the adapter
const prisma = new PrismaClient({ adapter });

async function createSuperAdmin() {
  const adminDetails = {
    full_name: "Super Admin",
    email: "ceo@tiller.com.bd",
    password: "adminpassword123", // Change this to your desired password
    role: "SUPERADMIN",
  };

  console.log(`🚀 Starting super admin creation for: ${adminDetails.email}...`);

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminDetails.email },
    });

    if (existingUser) {
      console.error("❌ Error: A user with this email already exists.");
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(adminDetails.password, saltRounds);

    // Create the user in the database
    const newAdmin = await prisma.user.create({
      data: {
        full_name: adminDetails.full_name,
        email: adminDetails.email,
        password_hash: password_hash,
        role: adminDetails.role,
        is_active: true,
      },
    });

    console.log("✅ Super Admin created successfully!");
    console.log("-----------------------------------");
    console.log(`ID: ${newAdmin.id}`);
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Role: ${newAdmin.role}`);
    console.log("-----------------------------------");

  } catch (error) {
    console.error("❌ An error occurred while creating the admin:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createSuperAdmin();