import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { handlePrismaError } from "@/lib/api-error";
import { parseYearValue, getYearDateRange } from "@/lib/date-utils";
import { filterProjectsByEffectiveStatus } from "@/lib/project-status";

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
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
    // Note: status filter is applied after fetching using effective status logic

    // Parse year filter if provided (and not "all")
    let dateRange: { start: Date; end: Date } | null = null;
    if (yearParam && yearParam !== "all") {
      const { type: yearType, year } = parseYearValue(yearParam);
      const isFiscal = yearType === "fiscal";
      dateRange = getYearDateRange(year, isFiscal);
    }

    const allProjects = await prisma.project.findMany({
      where: projectWhere,
      include: { bills: true },
    });

    // Apply effective status filter
    const projects = filterProjectsByEffectiveStatus(allProjects, status || 'all');

    // Helper to check if a bill's tentative date falls within the date range (for budget)
    const isBillScheduledInDateRange = (bill: any): boolean => {
      if (!dateRange) return true;
      const billDate = bill.tentativeBillingDate ? new Date(bill.tentativeBillingDate) : null;
      if (!billDate) return false;
      return billDate >= dateRange.start && billDate <= dateRange.end;
    };

    // Helper to check if a bill's received date falls within the date range (for received/remaining)
    const isBillReceivedInDateRange = (bill: any): boolean => {
      if (!dateRange) return true;
      const recDate = bill.receivedDate ? new Date(bill.receivedDate) : null;
      if (!recDate) return false;
      return recDate >= dateRange.start && recDate <= dateRange.end;
    };

    const allBills = projects.flatMap((p) => p.bills);

    // Total Budget = bills scheduled (tentativeBillingDate) in the selected year
    const scheduledBills = dateRange
      ? allBills.filter(isBillScheduledInDateRange)
      : allBills;
    const totalBudget = scheduledBills.reduce(
      (sum, b) => sum + Number(b.billAmount || 0),
      0
    );

    // Total Received = receivedAmount from bills where receivedDate is in the selected year
    const receivedBills = dateRange
      ? allBills.filter(isBillReceivedInDateRange)
      : allBills;
    const totalReceived = receivedBills
      .filter((b) => b.status === "PAID" || b.status === "PARTIAL")
      .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);

    // Total Remaining = scheduled bills that are PENDING or PARTIAL (remaining portion)
    const totalRemaining = scheduledBills.reduce((sum, b) => {
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
    // Filter projects that have at least one bill scheduled in the date range
    const projectsWithBillsInRange = dateRange
      ? projects.filter((p) => p.bills.some(isBillScheduledInDateRange))
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
