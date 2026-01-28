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
    const { projectName, startDate, endDate, totalProjectValue, clientId, departmentId, categoryId, pg, status } = body;

    // Validate the project exists and get bills for status validation
    const existingProject = await prisma.project.findUnique({
      where: { id: parsedId },
      include: { bills: true },
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

    // Handle status updates
    if (status !== undefined) {
      const validStatuses = ['ONGOING', 'COMPLETED', 'PENDING_PAYMENT'];
      if (!validStatuses.includes(status)) {
        return apiError("Invalid status. Must be ONGOING, COMPLETED, or PENDING_PAYMENT", "VALIDATION_ERROR");
      }
      updateData.status = status;
    }

    // Handle PG updates
    if (pg !== undefined) {
      if (pg && (pg.percent > 0 || pg.amount > 0)) {
        const totalValue = totalProjectValue !== undefined
          ? Number(totalProjectValue)
          : Number(existingProject.totalProjectValue || 0);

        let pgAmount = 0;
        let pgPercent = 0;

        // Calculate based on input type
        if (pg.inputType === 'percentage') {
          pgPercent = parseFloat(pg.percent) || 0;
          pgAmount = (pgPercent / 100) * totalValue;
        } else {
          pgAmount = parseFloat(pg.amount) || 0;
          pgPercent = totalValue > 0 ? (pgAmount / totalValue) * 100 : 0;
        }

        // Validate PG values
        if (pgPercent > 100) {
          return apiError("PG percentage cannot exceed 100%", "VALIDATION_ERROR");
        }
        if (pgAmount > totalValue) {
          return apiError("PG amount cannot exceed total project value", "VALIDATION_ERROR");
        }

        const bankSharePercent = parseFloat(pg.bankSharePercent) || 0;
        if (bankSharePercent < 0 || bankSharePercent > 100) {
          return apiError("Bank share percentage must be between 0 and 100", "VALIDATION_ERROR");
        }

        const userSharePercent = 100 - bankSharePercent;
        const pgUserDeposit = (userSharePercent / 100) * pgAmount;

        updateData.pgPercent = pgPercent;
        updateData.pgAmount = pgAmount;
        updateData.pgBankSharePercent = bankSharePercent;
        updateData.pgUserDeposit = pgUserDeposit;

        // Don't overwrite status and clearance date if already set
        if (existingProject.pgStatus === null || existingProject.pgStatus === undefined) {
          updateData.pgStatus = 'PENDING';
        }
      } else {
        // Clear PG if pg is explicitly set to null or empty
        updateData.pgPercent = null;
        updateData.pgAmount = null;
        updateData.pgBankSharePercent = null;
        updateData.pgUserDeposit = null;
        updateData.pgStatus = null;
        updateData.pgClearanceDate = null;
      }
    }

    // If totalProjectValue changed and PG exists, recalculate PG amounts based on stored percent
    if (totalProjectValue !== undefined && existingProject.pgPercent && !pg) {
      const newTotal = Number(totalProjectValue);
      const pgPercent = Number(existingProject.pgPercent);
      const pgAmount = (pgPercent / 100) * newTotal;
      const bankShare = Number(existingProject.pgBankSharePercent || 0);
      const pgUserDeposit = ((100 - bankShare) / 100) * pgAmount;

      updateData.pgAmount = pgAmount;
      updateData.pgUserDeposit = pgUserDeposit;
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
