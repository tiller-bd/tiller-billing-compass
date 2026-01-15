import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { handlePrismaError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const where: any = {};
    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (departmentId && departmentId !== "all") {
      const parsed = parseInt(departmentId);
      if (!isNaN(parsed)) where.departmentId = parsed;
    }
    if (clientId && clientId !== "all") {
      const parsed = parseInt(clientId);
      if (!isNaN(parsed)) where.clientId = parsed;
    }
    if (projectId && projectId !== "all") {
      const parsed = parseInt(projectId);
      if (!isNaN(parsed)) where.id = parsed;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        bills: {
          select: {
            id: true,
            billName: true,
            slNo: true,
            billAmount: true,
            receivedAmount: true,
            remainingAmount: true,
          },
        },
      },
    });

    // Create sunburst data structure
    const sunburstData = projects.map((project, idx) => {
      const projectTotal = Number(project.totalProjectValue) || 0;

      // Generate color based on index using golden angle for good distribution
      const hue = (idx * 137.5) % 360;

      return {
        name: project.projectName,
        value: projectTotal || 1, // Use 1 as minimum to show project even without value
        fill: `hsl(${hue}, 70%, 50%)`,
        children: project.bills.map((bill, billIdx) => {
          // Calculate lightness based on bill status
          const received = Number(bill.receivedAmount) || 0;
          const total = Number(bill.billAmount) || 0;
          const percentReceived = total > 0 ? (received / total) * 100 : 0;

          // Color intensity based on payment status
          // Fully paid: lighter, unpaid: darker
          const lightness = 45 + (percentReceived / 100) * 20; // 45% to 65%

          return {
            name: bill.billName || bill.slNo || `Bill ${billIdx + 1}`,
            value: Number(bill.billAmount),
            fill: `hsl(${hue}, 65%, ${lightness}%)`,
            received: Number(bill.receivedAmount) || 0,
            remaining: Number(bill.remainingAmount) || 0,
            percentReceived: Math.round(percentReceived),
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