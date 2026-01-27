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

    // Build bill where clause
    const billWhere: any = {
      status: { not: 'PAID' },
      tentativeBillingDate: { gte: new Date() },
      project: projectWhere,
    };

    // Year filter on tentativeBillingDate (skip if "all")
    if (yearParam && yearParam !== "all") {
      const { type: yearType, year } = parseYearValue(yearParam);
      const isFiscal = yearType === "fiscal";
      const { start, end } = getYearDateRange(year, isFiscal);
      // Combine with existing gte filter
      billWhere.tentativeBillingDate = {
        gte: new Date() > start ? new Date() : start, // Use whichever is later
        lte: end,
      };
    }

    const bills = await prisma.projectBill.findMany({
      where: billWhere,
      orderBy: { tentativeBillingDate: 'asc' },
      take: 5,
      include: { project: true }
    });

    const formatted = bills.map(b => ({
      projectName: b.project.projectName,
      amount: Number(b.billAmount),
      dueDate: b.tentativeBillingDate
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Deadlines API Error:', error);
    return handlePrismaError(error);
  }
}