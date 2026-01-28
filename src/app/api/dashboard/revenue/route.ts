import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import {
  parseYearValue,
  getYearDateRange,
  getCalendarYearMonths,
  getFiscalYearMonths,
  getFiscalMonthIndex,
  getCurrentFiscalYear,
} from "@/lib/date-utils";
import { filterProjectsByEffectiveStatus } from "@/lib/project-status";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const search = searchParams.get("search") || "";
  const departmentId = searchParams.get("departmentId");
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  // Handle "all" year - default to current fiscal year for monthly chart
  // (monthly breakdown only makes sense within a single year)
  let effectiveYearParam = yearParam;
  if (!yearParam || yearParam === "all") {
    effectiveYearParam = `fy-${getCurrentFiscalYear()}`;
  }

  // Parse the year value to determine calendar or fiscal year
  const { type: yearType, year } = parseYearValue(effectiveYearParam);
  const isFiscal = yearType === "fiscal";
  const { start, end } = getYearDateRange(year, isFiscal);

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
  // Note: status filter is applied after fetching using effective status logic

  // Fetch projects with their bills for effective status calculation
  const allProjects = await prisma.project.findMany({
    where: projectWhere,
    include: { bills: true },
  });

  // Apply effective status filter
  const filteredProjects = filterProjectsByEffectiveStatus(allProjects, status || 'all');
  const filteredProjectIds = filteredProjects.map(p => p.id);

  // Get bills from filtered projects within date range
  const bills = filteredProjectIds.length > 0
    ? await prisma.projectBill.findMany({
        where: {
          projectId: { in: filteredProjectIds },
          receivedDate: {
            gte: start,
            lte: end,
          },
          status: { in: ["PAID", "PARTIAL"] },
        },
      })
    : [];

  // Use appropriate month ordering based on year type
  const months = isFiscal ? getFiscalYearMonths() : getCalendarYearMonths();

  const data = months.map((month, index) => {
    const amount = bills
      .filter((b) => {
        if (!b.receivedDate) return false;
        const billDate = new Date(b.receivedDate);
        if (isFiscal) {
          // For fiscal year, use fiscal month index (July=0, ..., June=11)
          return getFiscalMonthIndex(billDate) === index;
        } else {
          // For calendar year, use standard month index (Jan=0, ..., Dec=11)
          return billDate.getMonth() === index;
        }
      })
      .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);
    return { month, received: amount };
  });

  return NextResponse.json(data);
}
