import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError, apiError } from "@/lib/api-error";

export async function GET() {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Departments fetch error:", error);
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return apiError("Department name is required", "VALIDATION_ERROR");
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("Department create error:", error);
    return handlePrismaError(error);
  }
}
