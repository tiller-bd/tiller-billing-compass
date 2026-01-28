import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError, apiError } from "@/lib/api-error";
import { parseYearValue, getYearDateRange } from "@/lib/date-utils";
import { filterProjectsByEffectiveStatus, addEffectiveStatus } from "@/lib/project-status";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const categoryId = searchParams.get("categoryId");
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const where: any = {
      OR: [
        { projectName: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ],
    };

    if (departmentId && departmentId !== "all") {
      const parsed = parseInt(departmentId);
      if (!isNaN(parsed)) where.departmentId = parsed;
    }
    if (categoryId && categoryId !== "all") {
      const parsed = parseInt(categoryId);
      if (!isNaN(parsed)) where.categoryId = parsed;
    }
    if (clientId && clientId !== "all") {
      const parsed = parseInt(clientId);
      if (!isNaN(parsed)) where.clientId = parsed;
    }
    if (projectId && projectId !== "all") {
      const parsed = parseInt(projectId);
      if (!isNaN(parsed)) where.id = parsed;
    }

    // Parse year filter if provided (and not "all")
    let dateRange: { start: Date; end: Date } | null = null;
    if (year && year !== "all") {
      const { type: yearType, year: yearValue } = parseYearValue(year);
      const isFiscal = yearType === "fiscal";
      dateRange = getYearDateRange(yearValue, isFiscal);
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: true,
        department: true,
        category: true,
        bills: true,
      },
      orderBy: { startDate: "desc" },
    });

    // Helper to check if a bill falls within the date range
    const isBillInDateRange = (bill: any): boolean => {
      if (!dateRange) return true; // No year filter, include all
      const billDate = bill.tentativeBillingDate ? new Date(bill.tentativeBillingDate) : null;
      if (!billDate) return false;
      return billDate >= dateRange.start && billDate <= dateRange.end;
    };

    // Filter projects to only include those with bills in the date range
    // Also filter the bills themselves to only include those in range
    let filtered = dateRange
      ? projects
          .map((p) => ({
            ...p,
            bills: p.bills.filter(isBillInDateRange),
          }))
          .filter((p) => p.bills.length > 0)
      : projects;

    // Apply effective status filter (considers computed status based on bills, end date, etc.)
    filtered = filterProjectsByEffectiveStatus(filtered, status || 'all');

    // Add effective status to each project for frontend display
    const result = addEffectiveStatus(filtered);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Projects fetch error:", error);
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const {
      projectName,
      clientId,
      departmentId,
      categoryId,
      startDate,
      endDate,
      totalProjectValue,
      bills,
      pg,
    } = body;

    if (!projectName || !projectName.trim()) {
      return apiError("Project name is required", "VALIDATION_ERROR");
    }

    if (!departmentId) {
      return apiError("Department is required", "VALIDATION_ERROR");
    }

    if (!categoryId) {
      return apiError("Category is required", "VALIDATION_ERROR");
    }

    if (!clientId) {
      return apiError("Client is required", "VALIDATION_ERROR");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Build base data object
      const projectData: any = {
        projectName: projectName.trim(),
        clientId: parseInt(clientId),
        departmentId: parseInt(departmentId),
        categoryId: parseInt(categoryId),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalProjectValue: parseFloat(totalProjectValue) || 0,
        status: 'ONGOING', // Default status for new projects
        bills: {
          create: (bills || []).map((bill: any) => ({
            billName: bill.billName,
            billPercent: parseFloat(bill.billPercent) || 0,
            billAmount: parseFloat(bill.billAmount) || 0,
            tentativeBillingDate: bill.tentativeBillingDate
              ? new Date(bill.tentativeBillingDate)
              : null,
            status: "PENDING",
          })),
        },
      };

      // Only add PG fields if they're provided and have valid values
      const hasPgData = pg && pg.percent && parseFloat(pg.percent) > 0 ||
                        pg && pg.amount && parseFloat(pg.amount) > 0;

      if (hasPgData) {
        const totalValue = parseFloat(totalProjectValue) || 0;
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
          throw new Error("PG percentage cannot exceed 100%");
        }
        if (pgAmount > totalValue) {
          throw new Error("PG amount cannot exceed total project value");
        }

        const bankSharePercent = parseFloat(pg.bankSharePercent) || 0;
        if (bankSharePercent < 0 || bankSharePercent > 100) {
          throw new Error("Bank share percentage must be between 0 and 100");
        }

        const userSharePercent = 100 - bankSharePercent;
        const pgUserDeposit = (userSharePercent / 100) * pgAmount;

        projectData.pgPercent = pgPercent;
        projectData.pgAmount = pgAmount;
        projectData.pgBankSharePercent = bankSharePercent;
        projectData.pgUserDeposit = pgUserDeposit;
        projectData.pgStatus = 'PENDING';
        projectData.pgClearanceDate = null;
      }

      return await tx.project.create({
        data: projectData,
      });
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Project create error:", error);
    return handlePrismaError(error);
  }
}
