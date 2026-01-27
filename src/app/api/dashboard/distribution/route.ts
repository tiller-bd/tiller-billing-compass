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

    // Fetch projects with their department and bills
    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        },
        bills: {
          select: {
            id: true,
            billName: true,
            slNo: true,
            billAmount: true,
            receivedAmount: true,
            remainingAmount: true,
            tentativeBillingDate: true,
            status: true,
          },
        },
      },
    });

    // Helper to check if a bill falls within the date range
    const isBillInDateRange = (bill: any): boolean => {
      if (!dateRange) return true; // No year filter, include all
      const billDate = bill.tentativeBillingDate ? new Date(bill.tentativeBillingDate) : null;
      if (!billDate) return false;
      return billDate >= dateRange.start && billDate <= dateRange.end;
    };

    // Filter bills by year and only include projects that have bills in range
    const projectsWithFilteredBills = projects
      .map((p) => ({
        ...p,
        bills: p.bills.filter(isBillInDateRange),
      }))
      .filter((p) => p.bills.length > 0);

    // Group by Department
    const departmentMap = new Map();

    projectsWithFilteredBills.forEach((project) => {
      // Handle projects with no department
      const deptId = project.department?.id || 'unassigned';
      const deptName = project.department?.name || 'Unassigned';

      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, {
          id: deptId,
          name: deptName,
          projects: []
        });
      }
      departmentMap.get(deptId).projects.push(project);
    });

    // Create 3-level Sunburst structure: Department -> Project -> Bill
    const sunburstData = Array.from(departmentMap.values()).map((dept, idx) => {
      // Department total = sum of all filtered bills' billAmount
      const deptTotal = dept.projects.reduce((sum: number, p: any) =>
        sum + p.bills.reduce((billSum: number, b: any) => billSum + (Number(b.billAmount) || 0), 0), 0);

      // Generate base hue for Department using golden angle
      const hue = (idx * 137.5) % 360;

      return {
        name: dept.name,
        value: deptTotal || 1, // Minimum 1 for visibility
        fill: `hsl(${hue}, 70%, 45%)`, // Darker base for center
        children: dept.projects.map((project: any) => {
          // Project total = sum of filtered bills' billAmount
          const projectTotal = project.bills.reduce((sum: number, b: any) => sum + (Number(b.billAmount) || 0), 0);

          return {
            name: project.projectName,
            value: projectTotal || 1,
            fill: `hsl(${hue}, 70%, 55%)`, // Medium shade for project ring
            children: project.bills.map((bill: any, billIdx: number) => {
              const received = Number(bill.receivedAmount) || 0;
              const total = Number(bill.billAmount) || 0;
              const percentReceived = total > 0 ? (received / total) * 100 : 0;

              // Lightness calculation: Paid bills are lighter, unpaid darker
              // Range: 65% to 90% lightness
              const lightness = 65 + (percentReceived / 100) * 25;

              return {
                name: bill.billName || bill.slNo || `Bill ${billIdx + 1}`,
                value: Number(bill.billAmount),
                fill: `hsl(${hue}, 75%, ${lightness}%)`,
                received: Number(bill.receivedAmount) || 0,
                remaining: Number(bill.remainingAmount) || 0,
                percentReceived: Math.round(percentReceived),
              };
            }),
          };
        }),
      };
    });

    return NextResponse.json(sunburstData);
  } catch (error) {
    console.error('Distribution API Error:', error);
    return handlePrismaError(error);
  }
}