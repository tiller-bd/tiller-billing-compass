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

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const search = searchParams.get("search") || "";
  const departmentId = searchParams.get("departmentId");
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");

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
  if (projectId && projectId !== "all") {
    projectWhere.id = parseInt(projectId);
  }

  // Revenue chart shows receivedAmount from PAID and PARTIAL bills
  const bills = await prisma.projectBill.findMany({
    where: {
      receivedDate: {
        gte: start,
        lte: end,
      },
      status: { in: ["PAID", "PARTIAL"] },
      project: projectWhere,
    },
    include: {
      project: true,
    },
  });

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
