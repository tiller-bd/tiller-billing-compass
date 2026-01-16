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
        bills: true,
      },
    });

    const comparison = projects.map((p) => {
      const totalValue = Number(p.totalProjectValue || 0);
      const received = p.bills.reduce((sum, b) => sum + Number(b.receivedAmount || 0), 0);
      const remaining = totalValue - received;

      return {
        // Shorten long names for chart readability
        name: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
        received, // Full amount
        remaining, // Full amount
      };
    });

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Budget Comparison API Error:', error);
    return handlePrismaError(error);
  }
}