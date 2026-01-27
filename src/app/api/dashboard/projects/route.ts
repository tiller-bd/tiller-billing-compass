import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { parseYearValue, getYearDateRange } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");
    const yearParam = searchParams.get("year");

    const projectWhere: any = {};
    if (search) {
      projectWhere.OR = [
        { projectName: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (departmentId && departmentId !== "all") {
      projectWhere.departmentId = parseInt(departmentId);
    }
    if (clientId && clientId !== "all") {
      projectWhere.clientId = parseInt(clientId);
    }
    if (projectId && projectId !== "all") {
      projectWhere.id = parseInt(projectId);
    }

    // Parse year filter if provided (and not "all")
    let dateRange: { start: Date; end: Date } | null = null;
    if (yearParam && yearParam !== "all") {
      const { type: yearType, year } = parseYearValue(yearParam);
      const isFiscal = yearType === "fiscal";
      dateRange = getYearDateRange(year, isFiscal);
    }

    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        client: true,
        category: true,
        bills: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // Helper to check if a bill falls within the date range
    const isBillInDateRange = (bill: any): boolean => {
      if (!dateRange) return true; // No year filter, include all
      const billDate = bill.tentativeBillingDate ? new Date(bill.tentativeBillingDate) : null;
      if (!billDate) return false;
      return billDate >= dateRange.start && billDate <= dateRange.end;
    };

    // Filter to only include projects that have at least one bill in the date range
    // Also filter the bills themselves to only include those in range
    const filteredProjects = dateRange
      ? projects
          .map((p) => ({
            ...p,
            bills: p.bills.filter(isBillInDateRange),
          }))
          .filter((p) => p.bills.length > 0)
      : projects;

    return NextResponse.json(filteredProjects);
  } catch (error) {
    console.error('Projects API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}