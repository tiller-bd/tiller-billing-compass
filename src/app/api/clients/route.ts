import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError, apiError } from "@/lib/api-error";
import { parseYearValue, getYearDateRange } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const yearParam = searchParams.get("year");

    // Build where clause
    const where: any = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ],
    };

    // If year filter is provided and not "all", filter clients with bills in that year
    let dateRange: { start: Date; end: Date } | null = null;
    if (yearParam && yearParam !== "all") {
      const { type: yearType, year } = parseYearValue(yearParam);
      const isFiscal = yearType === "fiscal";
      dateRange = getYearDateRange(year, isFiscal);

      where.projects = {
        some: {
          bills: {
            some: {
              tentativeBillingDate: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
          },
        },
      };
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        projects: {
          include: {
            bills: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Helper to check if bill is in date range
    const isBillInRange = (bill: any): boolean => {
      if (!dateRange) return true;
      const billDate = bill.tentativeBillingDate ? new Date(bill.tentativeBillingDate) : null;
      if (!billDate) return false;
      return billDate >= dateRange.start && billDate <= dateRange.end;
    };

    // Transform data to include financial aggregates (filtered by year if applicable)
    const transformed = clients.map((client) => {
      // Filter bills by year if dateRange is set
      const filteredProjects = client.projects.map(p => ({
        ...p,
        bills: dateRange ? p.bills.filter(isBillInRange) : p.bills,
      }));

      const totalBudget = filteredProjects
        .flatMap(p => p.bills)
        .reduce((sum, b) => sum + Number(b.billAmount || 0), 0);

      const totalReceived = filteredProjects
        .flatMap((p) => p.bills)
        .filter(b => b.status === 'PAID' || b.status === 'PARTIAL')
        .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);

      return {
        ...client,
        projectCount: filteredProjects.filter(p => p.bills.length > 0).length,
        totalBudget,
        totalReceived,
        totalDue: totalBudget - totalReceived,
        realizationRate:
          totalBudget > 0 ? (totalReceived / totalBudget) * 100 : 0,
      };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Clients fetch error:", error);
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;
  try {
    const body = await request.json();
    const { name, contactPerson, contactEmail, contactPhone } = body;

    if (!name || !name.trim()) {
      return apiError("Company name is required", "VALIDATION_ERROR");
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        contactPerson,
        contactEmail,
        contactPhone,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Client create error:", error);
    return handlePrismaError(error);
  }
}
