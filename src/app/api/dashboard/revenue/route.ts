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

  // Get bills with receivedDate in range (for actual received amounts)
  const receivedBills = filteredProjectIds.length > 0
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

  // Get bills with tentativeBillingDate in range (for expected/scheduled amounts)
  const scheduledBills = filteredProjectIds.length > 0
    ? await prisma.projectBill.findMany({
        where: {
          projectId: { in: filteredProjectIds },
          tentativeBillingDate: {
            gte: start,
            lte: end,
          },
        },
      })
    : [];

  // Use appropriate month ordering based on year type
  const months = isFiscal ? getFiscalYearMonths() : getCalendarYearMonths();

  const data = months.map((month, index) => {
    // Actual received in this month
    const received = receivedBills
      .filter((b) => {
        if (!b.receivedDate) return false;
        const billDate = new Date(b.receivedDate);
        if (isFiscal) {
          return getFiscalMonthIndex(billDate) === index;
        } else {
          return billDate.getMonth() === index;
        }
      })
      .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);

    // Expected/scheduled for this month (billAmount based on tentativeBillingDate)
    const expected = scheduledBills
      .filter((b) => {
        if (!b.tentativeBillingDate) return false;
        const billDate = new Date(b.tentativeBillingDate);
        if (isFiscal) {
          return getFiscalMonthIndex(billDate) === index;
        } else {
          return billDate.getMonth() === index;
        }
      })
      .reduce((sum, b) => sum + Number(b.billAmount || 0), 0);

    return { month, received, expected };
  });

  return NextResponse.json(data);
}
