import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError } from "@/lib/api-error";
import { parseYearValue, getYearDateRange } from "@/lib/date-utils";

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
      const parsed = parseInt(departmentId);
      if (!isNaN(parsed)) projectWhere.departmentId = parsed;
    }
    if (clientId && clientId !== "all") {
      const parsed = parseInt(clientId);
      if (!isNaN(parsed)) projectWhere.clientId = parsed;
    }
    if (projectId && projectId !== "all") {
      const parsed = parseInt(projectId);
      if (!isNaN(parsed)) projectWhere.id = parsed;
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
      include: { bills: true },
    });

    // Helper to check if a bill falls within the date range
    // For year filtering, we use tentativeBillingDate to determine which year a bill belongs to
    const isBillInDateRange = (bill: any): boolean => {
      if (!dateRange) return true; // No year filter, include all
      const billDate = bill.tentativeBillingDate ? new Date(bill.tentativeBillingDate) : null;
      if (!billDate) return false;
      return billDate >= dateRange.start && billDate <= dateRange.end;
    };

    // Filter bills by year if dateRange is set
    const allBills = projects.flatMap((p) => p.bills);
    const filteredBills = dateRange
      ? allBills.filter(isBillInDateRange)
      : allBills;

    // New calculation logic:
    // Total Budget = sum of ALL bills' billAmount in that year (regardless of status)
    const totalBudget = filteredBills.reduce(
      (sum, b) => sum + Number(b.billAmount || 0),
      0
    );

    // Total Received = sum of PAID + PARTIAL bills' receivedAmount
    const totalReceived = filteredBills
      .filter((b) => b.status === "PAID" || b.status === "PARTIAL")
      .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);

    // Total Remaining = PENDING bills' billAmount + PARTIAL bills' remaining (billAmount - receivedAmount)
    const totalRemaining = filteredBills.reduce((sum, b) => {
      if (b.status === "PENDING") {
        return sum + Number(b.billAmount || 0);
      } else if (b.status === "PARTIAL") {
        const billAmount = Number(b.billAmount || 0);
        const receivedAmount = Number(b.receivedAmount || 0);
        return sum + (billAmount - receivedAmount);
      }
      return sum;
    }, 0);

    // PG (Project Guarantee) Calculations - based on projects, not bills
    // Filter projects that have at least one bill in the date range, or all if no year filter
    const projectsWithBillsInRange = dateRange
      ? projects.filter((p) => p.bills.some(isBillInDateRange))
      : projects;

    const pgDeposited = projectsWithBillsInRange.reduce(
      (sum, p) => sum + Number(p.pgUserDeposit || 0),
      0
    );
    const pgCleared = projectsWithBillsInRange
      .filter((p) => p.pgStatus === "CLEARED")
      .reduce((sum, p) => sum + Number(p.pgUserDeposit || 0), 0);
    const pgPending = pgDeposited - pgCleared;

    return NextResponse.json({
      totalBudget,
      totalReceived,
      totalRemaining,
      activeCount: projectsWithBillsInRange.length,
      pgDeposited,
      pgCleared,
      pgPending,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return handlePrismaError(error);
  }
}
