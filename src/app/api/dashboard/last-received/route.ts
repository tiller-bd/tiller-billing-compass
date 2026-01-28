import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { handlePrismaError } from '@/lib/api-error';
import { parseYearValue, getYearDateRange } from '@/lib/date-utils';
import { filterProjectsByEffectiveStatus } from '@/lib/project-status';

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
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

    // Fetch projects with their bills for effective status calculation
    const allProjects = await prisma.project.findMany({
      where: projectWhere,
      include: { bills: true },
    });

    // Apply effective status filter
    const filteredProjects = filterProjectsByEffectiveStatus(allProjects, status || 'all');
    const filteredProjectIds = filteredProjects.map(p => p.id);

    if (filteredProjectIds.length === 0) {
      return NextResponse.json([]);
    }

    // Build bill where clause
    const billWhere: any = {
      projectId: { in: filteredProjectIds },
      status: 'PAID',
      receivedAmount: { gt: 0 },
    };

    // Year filter on receivedDate (skip if "all")
    if (yearParam && yearParam !== "all") {
      const { type: yearType, year } = parseYearValue(yearParam);
      const isFiscal = yearType === "fiscal";
      const { start, end } = getYearDateRange(year, isFiscal);
      billWhere.receivedDate = {
        gte: start,
        lte: end,
      };
    }

    const bills = await prisma.projectBill.findMany({
      where: billWhere,
      orderBy: { receivedDate: 'desc' },
      take: 5,
      include: { project: true }
    });

    const formatted = bills.map(b => ({
      projectName: b.project.projectName,
      amount: Number(b.receivedAmount),
      date: b.receivedDate
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Last Received API Error:', error);
    return handlePrismaError(error);
  }
}
