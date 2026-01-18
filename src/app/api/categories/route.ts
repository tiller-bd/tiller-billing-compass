import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError, apiError } from "@/lib/api-error";

export async function GET() {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const categories = await prisma.projectCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories fetch error:", error);
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
      return apiError("Category name is required", "VALIDATION_ERROR");
    }

    const category = await prisma.projectCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Category create error:", error);
    return handlePrismaError(error);
  }
}
