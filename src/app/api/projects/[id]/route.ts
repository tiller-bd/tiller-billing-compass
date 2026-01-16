// src/app/api/projects/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError, apiError } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        department: true,
        category: true,
        bills: {
          orderBy: { tentativeBillingDate: "asc" },
        },
      },
    });

    if (!project)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { projectName, startDate, endDate, totalProjectValue, clientId, departmentId, categoryId } = body;

    // Validate the project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: parsedId },
    });

    if (!existingProject) {
      return apiError("Project not found", "NOT_FOUND");
    }

    // Build update data object - only include provided fields
    const updateData: any = {};

    if (projectName !== undefined) {
      if (!projectName || projectName.trim() === "") {
        return apiError("Project name cannot be empty", "VALIDATION_ERROR");
      }
      updateData.projectName = projectName.trim();
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }

    if (totalProjectValue !== undefined) {
      const value = Number(totalProjectValue);
      if (isNaN(value) || value < 0) {
        return apiError("Invalid project value", "VALIDATION_ERROR");
      }
      updateData.totalProjectValue = value;
    }

    if (clientId !== undefined) {
      updateData.clientId = parseInt(clientId);
    }

    if (departmentId !== undefined) {
      updateData.departmentId = parseInt(departmentId);
    }

    if (categoryId !== undefined) {
      updateData.categoryId = parseInt(categoryId);
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: parsedId },
      data: updateData,
      include: {
        client: true,
        department: true,
        category: true,
        bills: {
          orderBy: { tentativeBillingDate: "asc" },
        },
      },
    });

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("Project update error:", error);
    return handlePrismaError(error);
  }
}
