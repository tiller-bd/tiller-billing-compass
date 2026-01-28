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
    const departmentId = searchParams.get("departmentId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const yearParam = searchParams.get("year");

    const where: any = {};

    if (departmentId && departmentId !== "all") {
      const parsed = parseInt(departmentId);
      if (!isNaN(parsed)) where.departmentId = parsed;
    }
    if (clientId && clientId !== "all") {
      const parsed = parseInt(clientId);
      if (!isNaN(parsed)) where.clientId = parsed;
    }
    // Note: status filter is applied after fetching using effective status logic

    // Parse year filter for filtering events (skip if "all")
    let dateRange: { start: Date; end: Date } | null = null;
    if (yearParam && yearParam !== "all") {
      const { type: yearType, year } = parseYearValue(yearParam);
      const isFiscal = yearType === "fiscal";
      dateRange = getYearDateRange(year, isFiscal);
    }

    const allProjects = await prisma.project.findMany({
      where,
      include: {
        bills: true,
      },
    });

    // Apply effective status filter
    const projects = filterProjectsByEffectiveStatus(allProjects, status || 'all');

    const events: any[] = [];

    // Helper function to check if date is within range
    const isInDateRange = (date: Date | null): boolean => {
      if (!date) return false;
      if (!dateRange) return true; // No filter, include all
      const d = new Date(date);
      return d >= dateRange.start && d <= dateRange.end;
    };

    projects.forEach((project) => {
      // Add project signed date (start date)
      if (project.startDate && isInDateRange(project.startDate)) {
        events.push({
          date: project.startDate,
          type: 'project_signed',
          title: 'Project Signed',
          projectName: project.projectName,
        });
      }

      // Add PG cleared date
      if (project.pgClearanceDate && project.pgStatus === 'CLEARED' && isInDateRange(project.pgClearanceDate)) {
        events.push({
          date: project.pgClearanceDate,
          type: 'pg_cleared',
          title: 'PG Cleared',
          projectName: project.projectName,
          amount: Number(project.pgUserDeposit || 0),
        });
      }

      // Add bill events
      project.bills.forEach((bill) => {
        // Tentative payment dates
        if (bill.tentativeBillingDate && bill.status !== 'PAID' && isInDateRange(bill.tentativeBillingDate)) {
          events.push({
            date: bill.tentativeBillingDate,
            type: 'tentative_payment',
            title: bill.billName || 'Payment Due',
            projectName: project.projectName,
            amount: Number(bill.billAmount),
          });
        }

        // Received payment dates
        if (bill.receivedDate && bill.receivedAmount && Number(bill.receivedAmount) > 0 && isInDateRange(bill.receivedDate)) {
          events.push({
            date: bill.receivedDate,
            type: 'received_payment',
            title: bill.billName || 'Payment Received',
            projectName: project.projectName,
            amount: Number(bill.receivedAmount),
          });
        }
      });
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return handlePrismaError(error);
  }
}
