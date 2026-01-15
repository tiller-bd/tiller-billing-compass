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

    const bills = await prisma.projectBill.findMany({
      where: {
        status: 'PAID',
        receivedAmount: { gt: 0 },
        project: projectWhere,
      },
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