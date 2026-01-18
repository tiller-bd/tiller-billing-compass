// src/app/api/projects/[id]/clear-pg/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return apiError("Invalid project ID", "BAD_REQUEST");
    }

    const project = await prisma.project.findUnique({
      where: { id: parsedId }
    });

    if (!project) {
      return apiError("Project not found", "NOT_FOUND");
    }

    // Validate that PG exists and is pending
    if (!project.pgAmount || Number(project.pgAmount) === 0) {
      return apiError("No Project Guarantee set for this project", "VALIDATION_ERROR");
    }

    if (project.pgStatus === 'CLEARED') {
      return apiError("Project Guarantee is already cleared", "VALIDATION_ERROR");
    }

    // Mark PG as cleared
    const updated = await prisma.project.update({
      where: { id: parsedId },
      data: {
        pgStatus: 'CLEARED',
        pgClearanceDate: new Date()
      },
      include: {
        client: true,
        department: true,
        category: true,
        bills: {
          orderBy: { tentativeBillingDate: "asc" },
        },
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Clear PG error:", error);
    return apiError("Failed to clear Project Guarantee", "INTERNAL_ERROR");
  }
}
