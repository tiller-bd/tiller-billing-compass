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

    // Fetch projects with their client and bills
    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        client: {
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

    // Group by Client
    const clientMap = new Map();

    projectsWithFilteredBills.forEach((project) => {
      // Handle projects with no client
      const clientIdVal = project.client?.id || 'unassigned';
      const clientName = project.client?.name || 'Unassigned';

      if (!clientMap.has(clientIdVal)) {
        clientMap.set(clientIdVal, {
          id: clientIdVal,
          name: clientName,
          projects: []
        });
      }
      clientMap.get(clientIdVal).projects.push(project);
    });

    // Create 2-level Sunburst structure: Client -> Project
    const sunburstData = Array.from(clientMap.values()).map((client, idx) => {
      // Calculate totals from bills
      const clientTotalBudget = client.projects.reduce((sum: number, p: any) =>
        sum + p.bills.reduce((billSum: number, b: any) => billSum + (Number(b.billAmount) || 0), 0), 0);

      const clientTotalReceived = client.projects.reduce((sum: number, p: any) =>
        sum + p.bills
          .filter((b: any) => b.status === 'PAID' || b.status === 'PARTIAL')
          .reduce((billSum: number, b: any) => billSum + (Number(b.receivedAmount) || 0), 0), 0);

      const clientTotalRemaining = client.projects.reduce((sum: number, p: any) =>
        sum + p.bills.reduce((billSum: number, b: any) => {
          if (b.status === 'PENDING') {
            return billSum + (Number(b.billAmount) || 0);
          } else if (b.status === 'PARTIAL') {
            return billSum + ((Number(b.billAmount) || 0) - (Number(b.receivedAmount) || 0));
          }
          return billSum;
        }, 0), 0);

      // Generate base hue for Client using golden angle for better distribution
      const hue = (idx * 137.5) % 360;

      return {
        name: client.name,
        value: clientTotalBudget || 1, // Minimum 1 for visibility
        fill: `hsl(${hue}, 70%, 45%)`, // Darker base for inner ring
        received: clientTotalReceived,
        remaining: clientTotalRemaining,
        projectCount: client.projects.length,
        children: client.projects.map((project: any, projIdx: number) => {
          // Project totals from bills
          const projectBudget = project.bills.reduce((sum: number, b: any) => sum + (Number(b.billAmount) || 0), 0);

          const projectReceived = project.bills
            .filter((b: any) => b.status === 'PAID' || b.status === 'PARTIAL')
            .reduce((sum: number, b: any) => sum + (Number(b.receivedAmount) || 0), 0);

          const projectRemaining = project.bills.reduce((sum: number, b: any) => {
            if (b.status === 'PENDING') {
              return sum + (Number(b.billAmount) || 0);
            } else if (b.status === 'PARTIAL') {
              return sum + ((Number(b.billAmount) || 0) - (Number(b.receivedAmount) || 0));
            }
            return sum;
          }, 0);

          const percentReceived = projectBudget > 0 ? (projectReceived / projectBudget) * 100 : 0;

          // Shade variation for projects under same client
          // Lightness ranges from 55% to 75% based on project index
          const projectCount = client.projects.length;
          const lightnessStep = projectCount > 1 ? 20 / (projectCount - 1) : 0;
          const lightness = 55 + (projIdx * lightnessStep);

          return {
            name: project.projectName,
            value: projectBudget || 1,
            fill: `hsl(${hue}, 65%, ${Math.min(lightness, 75)}%)`, // Lighter shades for outer ring
            received: projectReceived,
            remaining: projectRemaining,
            percentReceived: Math.round(percentReceived),
            billCount: project.bills.length,
            clientName: client.name,
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
