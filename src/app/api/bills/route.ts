import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError, apiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");
    const year = searchParams.get("year");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const where: any = {
      OR: [
        { billName: { contains: search, mode: "insensitive" } },
        { project: { projectName: { contains: search, mode: "insensitive" } } },
        {
          project: {
            client: { name: { contains: search, mode: "insensitive" } },
          },
        },
      ],
    };

    if (status && status !== "all") where.status = status;
    if (departmentId && departmentId !== "all") {
      const parsedDeptId = parseInt(departmentId);
      if (isNaN(parsedDeptId)) {
        return apiError("Invalid department ID", "BAD_REQUEST");
      }
      where.project = {
        ...where.project,
        departmentId: parsedDeptId,
      };
    }
    if (clientId && clientId !== "all") {
      const parsedClientId = parseInt(clientId);
      if (isNaN(parsedClientId)) {
        return apiError("Invalid client ID", "BAD_REQUEST");
      }
      where.project = {
        ...where.project,
        clientId: parsedClientId,
      };
    }
    if (projectId && projectId !== "all") {
      const parsedProjectId = parseInt(projectId);
      if (isNaN(parsedProjectId)) {
        return apiError("Invalid project ID", "BAD_REQUEST");
      }
      where.project = {
        ...where.project,
        id: parsedProjectId,
      };
    }
    if (year && year !== "all") {
      where.tentativeBillingDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const bills = await prisma.projectBill.findMany({
      where,
      include: {
        project: {
          include: {
            client: true,
            department: true,
          },
        },
      },
      orderBy: { tentativeBillingDate: "asc" },
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Bills fetch error:", error);
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const {
      projectId,
      billName,
      billPercent,
      billAmount,
      tentativeBillingDate,
      status,
      slNo,
    } = body;

    if (!projectId) {
      return apiError("Project ID is required", "VALIDATION_ERROR");
    }

    if (billAmount === undefined || billAmount === null) {
      return apiError("Bill amount is required", "VALIDATION_ERROR");
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      return apiError("Project not found", "NOT_FOUND");
    }

    const newBill = await prisma.projectBill.create({
      data: {
        projectId: parseInt(projectId),
        billName: billName || null,
        billPercent: billPercent ? parseFloat(billPercent) : null,
        billAmount: parseFloat(billAmount),
        tentativeBillingDate: tentativeBillingDate
          ? new Date(tentativeBillingDate)
          : null,
        status: status || "PENDING",
        slNo: slNo || null,
        receivedAmount: 0,
      },
      include: {
        project: {
          include: {
            client: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json(newBill, { status: 201 });
  } catch (error) {
    console.error("Bill create error:", error);
    return handlePrismaError(error);
  }
}
