import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { handlePrismaError } from '@/lib/api-error';
import { parseYearValue, getYearDateRange } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
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
      include: {
        bills: true,
      },
    });

    // Helper to check if a bill falls within the date range
    const isBillInDateRange = (bill: any): boolean => {
      if (!dateRange) return true; // No year filter, include all
      const billDate = bill.tentativeBillingDate ? new Date(bill.tentativeBillingDate) : null;
      if (!billDate) return false;
      return billDate >= dateRange.start && billDate <= dateRange.end;
    };

    // Filter to only include projects that have bills in the date range
    const projectsWithBillsInRange = projects
      .map((p) => ({
        ...p,
        bills: p.bills.filter(isBillInDateRange),
      }))
      .filter((p) => p.bills.length > 0);

    const comparison = projectsWithBillsInRange.map((p) => {
      // Budget = sum of ALL bills' billAmount in the filtered range
      const budget = p.bills.reduce((sum, b) => sum + Number(b.billAmount || 0), 0);
      // Received = sum of PAID + PARTIAL bills' receivedAmount
      const received = p.bills
        .filter((b) => b.status === "PAID" || b.status === "PARTIAL")
        .reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);
      // Remaining = PENDING bills' billAmount + PARTIAL bills' remaining (billAmount - receivedAmount)
      const remaining = p.bills.reduce((sum, b) => {
        if (b.status === "PENDING") {
          return sum + Number(b.billAmount || 0);
        } else if (b.status === "PARTIAL") {
          const billAmount = Number(b.billAmount || 0);
          const receivedAmount = Number(b.receivedAmount || 0);
          return sum + (billAmount - receivedAmount);
        }
        return sum;
      }, 0);

      return {
        // Shorten long names for chart readability
        name: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
        budget,
        received,
        remaining,
      };
    });

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Budget Comparison API Error:', error);
    return handlePrismaError(error);
  }
}